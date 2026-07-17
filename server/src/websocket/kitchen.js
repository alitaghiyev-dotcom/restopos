import { WebSocketServer } from 'ws';

let wss = null;
const kitchenClients = new Set();

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws/kitchen' });

  wss.on('connection', (ws) => {
    console.log('🔌 Mutfak ekranı bağlandı');
    kitchenClients.add(ws);

    ws.on('close', () => {
      console.log('🔌 Mutfak ekranı ayrıldı');
      kitchenClients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket hatası:', err.message);
      kitchenClients.delete(ws);
    });
  });

  console.log('✅ WebSocket sunucusu başlatıldı (path: /ws/kitchen)');
}

export function broadcastToKitchen(data) {
  const message = JSON.stringify(data);
  for (const client of kitchenClients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}
