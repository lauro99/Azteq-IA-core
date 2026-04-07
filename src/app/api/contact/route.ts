import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, email, phone, company, plan, message } = await request.json();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_ay7qbEvD_DDb5h5KnG6VTUPATfmBZwcSK',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Azteq IA <onboarding@resend.dev>', // Usando el dominio por defecto de resend de prueba (onboarding)
        to: 'laureano.g.t@outlook.com', 
        subject: `Nuevo Formulario Azteq: Solicitud de Validación de Montaje`,
        html: `
          <h2>Solicitud de Validación - Formulario Azteq</h2>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email (Sesión):</strong> ${email}</p>
          <p><strong>Teléfono:</strong> ${phone}</p>
          <p><strong>Empresa / Planta:</strong> ${company}</p>
          <p><strong>Plan Solicitado:</strong> ${plan}</p>
          <p><strong>Mensaje Adicional:</strong><br/> ${message || '<em>Sin mensaje</em>'}</p>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Error from Resend:', data);
      return NextResponse.json({ error: 'Failed to send email' }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in contact form API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
