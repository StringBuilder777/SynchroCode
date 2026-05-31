import { createConnection } from "net";
import { URL } from "url";

const BACKEND_URL = process.env.API_INTERNAL_URL || "http://localhost:8080";

export function setupWsProxy(server) {
  server.on("upgrade", (req, socket, head) => {
    if (!req.url?.startsWith("/ws/")) return;

    const backend = new URL(BACKEND_URL);
    const port = parseInt(backend.port) || 80;

    const proxy = createConnection({ host: backend.hostname, port }, () => {
      const path = req.url;
      const headers = Object.entries(req.headers)
        .filter(([k]) => k !== "host")
        .map(([k, v]) => `${k}: ${v}`)
        .join("\r\n");

      proxy.write(
        `GET ${path} HTTP/1.1\r\nHost: ${backend.hostname}:${port}\r\n${headers}\r\nConnection: Upgrade\r\n\r\n`
      );

      if (head && head.length) proxy.write(head);
      socket.pipe(proxy);
      proxy.pipe(socket);
    });

    proxy.on("error", () => socket.end());
    socket.on("error", () => proxy.end());
  });
}
