import { NextResponse } from 'next/server';
import { processInboundEmail } from '@/app/actions/email';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Extraer datos clave del webhook de Plunk.
    const from = payload.from;
    const to = payload.to;
    const subject = payload.subject;
    const body = payload.text || payload.html || 'No content';

    console.log('--- Email Ingest Webhook Received ---');
    console.log('From:', from);
    console.log('To:', to);
    
    // Llamar a la Server Action para procesar el correo y enviar la respuesta
    const result = await processInboundEmail({ from, to, subject, body });

    if ('error' in result) {
        console.error('Failed to process email:', result.error);
        // Aún así respondemos 200 OK a Plunk para evitar reintentos.
        // El error ya se registró en nuestro lado.
        return NextResponse.json({ success: true, message: 'Webhook received, but processing failed internally.' });
    }
    
    console.log('--- Agent processing and reply complete ---');

    // Responder a Plunk con un 200 OK para confirmar la recepción.
    return NextResponse.json({ success: true, message: 'Email received and processed' });

  } catch (error: any) {
    console.error('Error al procesar el webhook de email-ingest:', error);
    return NextResponse.json({ success: false, error: 'Fallo al procesar la petición' }, { status: 500 });
  }
}
