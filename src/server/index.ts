import { WebSocketServer } from 'ws';
import { CallHandler } from './call-handler';
import { config } from 'dotenv';

config();

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

const wss = new WebSocketServer({ port });

wss.on('connection', (ws) => {
  console.log('[Server] WebSocket connection established.');
  // Each connection gets its own handler instance.
  new CallHandler(ws);
});

console.log(`WebSocket server started on port ${port}`);
