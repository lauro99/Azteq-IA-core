import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase PLC Errors] Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const { data, error } = await supabase
    .from('plc_errors')
    .select('*')
    .order('time', { ascending: false })
    .gte('time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('[Supabase PLC Errors] GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}

export async function DELETE() {
  const { error } = await supabase.from('plc_errors').delete().neq('id', 0);
  if (error) {
    console.error('[Supabase PLC Errors] DELETE error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
