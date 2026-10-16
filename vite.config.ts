import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { WebSocketServer, WebSocket } from 'ws'

function watchPartyRelayPlugin() {
  const rooms = new Map<string, Set<WebSocket>>();

  return {
    name: 'watchparty-local-relay',
    configureServer(server: any) {
      if (!server.httpServer) return;
      const wss = new WebSocketServer({ noServer: true });

      server.httpServer.on('upgrade', (request: any, socket: any, head: any) => {
        try {
          const url = new URL(request.url, `http://${request.headers.host}`);
          if (url.pathname === '/watchparty-ws') {
            const roomId = url.searchParams.get('room') || 'default';
            wss.handleUpgrade(request, socket, head, (ws) => {
              if (!rooms.has(roomId)) {
                rooms.set(roomId, new Set());
              }
              const clients = rooms.get(roomId)!;
              clients.add(ws);

              ws.on('message', (data: any) => {
                const messageStr = data.toString();
                for (const client of clients) {
                  if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(messageStr);
                  }
                }
              });

              ws.on('close', () => {
                clients.delete(ws);
                if (clients.size === 0) rooms.delete(roomId);
              });
            });
          }
        } catch (e) {
          console.error('[Relay] Upgrade error:', e);
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), watchPartyRelayPlugin()],
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
