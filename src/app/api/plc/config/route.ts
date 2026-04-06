import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface IOTag {
  id?: string;
  name: string;
  address: string;
  type: string;
  unit?: string;
  group?: string;
}

/**
 * POST /api/plc/config
 * Guarda o actualiza la configuración de tags (io_config) para un PLC específico
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plcId, ioTags, userId } = body;

    // Validar parámetros
    if (!plcId) {
      return NextResponse.json({ error: 'ID del PLC es requerido' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    if (!Array.isArray(ioTags)) {
      return NextResponse.json({ error: 'io_config debe ser un array de tags' }, { status: 400 });
    }

    // Validar estructura de cada tag
    const validatedTags = ioTags
      .filter((tag) => tag.name && tag.address) // Solo tags con nombre y dirección
      .map((tag: IOTag, index: number) => ({
        id: tag.id || `tag_${index}_${Date.now()}`,
        name: tag.name.trim(),
        address: tag.address.trim().toUpperCase(),
        type: tag.type?.trim().toLowerCase() || 'bool',
        unit: tag.unit?.trim() || '',
        group: tag.group?.trim() || ''
      }));

    if (validatedTags.length === 0 && ioTags.length > 0) {
      return NextResponse.json({
        error: 'Ningún tag válido. Asegúrate de que cada tag tenga nombre y dirección'
      }, { status: 400 });
    }

    // Actualizar el PLC con la nueva configuración
    const { data, error } = await supabase
      .from('plcs')
      .update({ io_config: validatedTags })
      .eq('id', plcId)
      .eq('user_id', userId) // Seguridad: solo el propietario puede actualizar
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        error: 'PLC no encontrado o no tienes permiso para modificarlo'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Configuración guardada: ${validatedTags.length} tags registrados`,
      data: {
        plcId: data[0].id,
        tagCount: validatedTags.length,
        ioConfig: validatedTags
      }
    });
  } catch (error: any) {
    console.error('Error guardando configuración PLC:', error);
    return NextResponse.json({
      error: 'Error interno del servidor: ' + error.message
    }, { status: 500 });
  }
}
