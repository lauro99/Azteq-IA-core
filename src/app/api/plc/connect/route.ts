import { NextResponse } from 'next/server';
// @ts-ignore
import nodes7 from 'nodes7';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brand, ip, port, rack, slot, isCloud, mockMode, ioTags } = body;

    if (!ip) {
      return NextResponse.json({ success: false, error: 'Falta la dirección IP del PLC' }, { status: 400 });
    }

    // ----------------------------------------------------------------------
    // MODO ADMIN / PRUEBAS (SIMULACIÓN SIN HARDWARE)
    // ----------------------------------------------------------------------
    if (mockMode) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockSensorData: any = {
        temperaturaCpu: +(Math.random() * 10 + 40).toFixed(1),
        presionSistema: +(Math.random() * 0.5 + 1.0).toFixed(2),
        estatusGeneral: 'OPERATIVO (TEST)',
        ciclosPorHora: Math.floor(Math.random() * 500 + 1000)
      };

      if (ioTags && ioTags.length > 0) {
        for (let key in mockSensorData) delete mockSensorData[key];
        mockSensorData.estatusGeneral = 'OPERATIVO (TEST)';
        
        ioTags.forEach((tag: any) => {
          let randomValue: any = 0;
          if (tag.type.toLowerCase().includes('bool')) {
            randomValue = Math.random() > 0.5;
          } else if (tag.type.toLowerCase().includes('real') || tag.type.toLowerCase().includes('float')) {
             randomValue = +(Math.random() * 100).toFixed(2);
          } else {
             randomValue = Math.floor(Math.random() * 100);
          }
          mockSensorData[tag.name] = randomValue;
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Conexión simulada con ' + brand.toUpperCase(),
        data: mockSensorData
      });
    }

    // ----------------------------------------------------------------------
    // MODO PRODUCCIÓN: CONEXIÓN FÍSICA AL PLC (SIEMENS S7)
    // ----------------------------------------------------------------------
    if (brand.toLowerCase() === 'siemens') {
      return new Promise<Response>((resolve) => {
        const conn = new nodes7();
        
        const plcPort = port ? parseInt(port, 10) : 102;
        const plcRack = rack !== undefined ? parseInt(rack, 10) : 0;
        const plcSlot = slot !== undefined ? parseInt(slot, 10) : 1;

        console.log('[nodes7] Intentando conectar fisicamente...');

        conn.initiateConnection({ port: plcPort, host: ip, rack: plcRack, slot: plcSlot }, (err: any) => {
          if (typeof err !== 'undefined') {
            return resolve(NextResponse.json({ 
              success: false, 
              error: 'Error de ping / conexión al PLC en ' + ip + ': ' + err 
            }, { status: 400 }));
          }

          conn.setTranslationCB((tag: string) => {
            if (ioTags && ioTags.length > 0) {
              const variable = ioTags.find((t: any) => t.name === tag);
              return variable ? variable.address : undefined;
            }
            
            const variables: Record<string, string> = {
              temperaturaCpu: 'DB1,REAL0',
              presionSistema: 'DB1,REAL4',
              ciclosPorHora:  'DB1,INT8' 
            };
            return variables[tag];
          });

          let itemsToRead = ['temperaturaCpu', 'presionSistema', 'ciclosPorHora'];
          if (ioTags && ioTags.length > 0) {
            itemsToRead = ioTags.map((t: any) => t.name);
          }

          conn.addItems(itemsToRead);

          conn.readAllItems((readErr: any, values: any) => {
            conn.dropConnection();

            if (readErr) {
              return resolve(NextResponse.json({
                success: false,
                error: 'Error leyendo PLC: ' + readErr
              }, { status: 500 }));
            }

            let finalData: any = { estatusGeneral: 'OPERATIVO' };
            if (ioTags && ioTags.length > 0) {
               itemsToRead.forEach(item => {
                 finalData[item] = values[item] !== undefined ? values[item] : '--';
               });
            } else {
               finalData = {
                 temperaturaCpu: values.temperaturaCpu?.toFixed(1) ?? '--',
                 presionSistema: values.presionSistema?.toFixed(2) ?? '--',
                 estatusGeneral: 'OPERATIVO',
                 ciclosPorHora: values.ciclosPorHora ?? 0
               };
            }

            resolve(NextResponse.json({
              success: true,
              message: 'Conectado REAL a ' + brand.toUpperCase(),
              data: finalData
            }));
          });
        });
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Para ' + brand.toUpperCase() + ' requerimos un driver distinto. Usa modo Admin Mock para probar interfaces.' 
    }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Excepción de Servidor: ' + error.message }, { status: 500 });
  }
}
