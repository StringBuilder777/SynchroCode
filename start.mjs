import http from "node:http";
import { setupWsProxy } from "./ws-proxy.mjs";

const originalCreateServer = http.createServer.bind(http);
http.createServer = function (...args) {
  const server = originalCreateServer(...args);
  setupWsProxy(server);
  return server;
};

await import("./dist/server/entry.mjs");
