import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not set on the server.' },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const clientToken = await ai.live.generateClientToken();
    return NextResponse.json({ token: clientToken });
  } catch (error: any) {
    console.error('Failed to generate GenAI client token:', error);
    return NextResponse.json(
      { error: 'Failed to generate client token.', details: error.message },
      { status: 500 }
    );
  }
}
