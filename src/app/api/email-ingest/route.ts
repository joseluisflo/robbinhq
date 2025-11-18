import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Extraer datos clave del webhook de Plunk.
    // La estructura exacta puede variar, pero nos basamos en campos comunes.
    const from = payload.from;
    const to = payload.to; // Esto contendrá la dirección única del agente
    const subject = payload.subject;
    const body = payload.text || payload.html; // Preferir texto plano, si no, usar HTML

    // Por ahora, solo registramos los datos para verificar que los recibimos.
    console.log('--- Email Ingest Webhook Recibido ---');
    console.log('De:', from);
    console.log('Para:', to);
    console.log('Asunto:', subject);
    console.log('Cuerpo (extracto):', body ? body.substring(0, 150) + '...' : 'Sin contenido en el cuerpo');
    console.log('------------------------------------');

    // Responder a Plunk con un 200 OK para confirmar la recepción.
    return NextResponse.json({ success: true, message: 'Email recibido' });

  } catch (error: any) {
    console.error('Error al procesar el webhook de email-ingest:', error);
    return NextResponse.json({ success: false, error: 'Fallo al procesar la petición' }, { status: 500 });
  }
}
