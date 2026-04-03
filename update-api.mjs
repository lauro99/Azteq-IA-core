import fs from 'fs';

let content = fs.readFileSync('src/app/api/plc/connect/route.ts', 'utf8');

// Update variable extraction
content = content.replace(
  'const { brand, ip, port, rack, slot, isCloud, mockMode } = body;', 
  'const { brand, ip, port, rack, slot, isCloud, mockMode, ioTags } = body;'
);

// Update mock mode
content = content.replace(/const mockSensorData = \{\s*temperaturaCpu:.*?\};\s*return NextResponse/s, `const mockSensorData: any = {
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

      return NextResponse`);

// Update Siemens physical block
content = content.replace(/conn\.setTranslationCB[\s\S]*\}\)\);/s,
`conn.setTranslationCB((tag: string) => {
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
        });`);

fs.writeFileSync('src/app/api/plc/connect/route.ts', content);
console.log('API route updated!');
