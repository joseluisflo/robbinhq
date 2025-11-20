// This file now handles both GET and POST requests for the Twilio stream.
// The GET request is necessary for the initial WebSocket handshake.
// The POST is kept for compatibility, although WebSocket communication doesn't use it directly.
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Acknowledge the WebSocket handshake GET request to allow the connection.
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: Request) {
  // Acknowledge the request to prevent Twilio from timing out.
  // The actual audio processing logic will be added here later.
  return new NextResponse(null, { status: 200 });
}
