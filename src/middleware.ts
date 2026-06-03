import { defineMiddleware } from "astro:middleware";

const BACKEND_URL = process.env.API_INTERNAL_URL || "http://localhost:8080";

export const onRequest = defineMiddleware(async ({ request }, next) => {
  const url = new URL(request.url);

  if (!url.pathname.startsWith("/api/")) {
    return next();
  }

  const backendPath = url.pathname.replace(/^\/api/, "") + url.search;
  const backendUrl = `${BACKEND_URL}${backendPath}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("access-control-request-method");
  headers.delete("access-control-request-headers");
  headers.delete("sec-fetch-site");
  headers.delete("sec-fetch-mode");
  headers.delete("sec-fetch-dest");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": url.origin,
        "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "authorization,content-type,x-requested-with",
        "access-control-allow-credentials": "true",
      },
    });
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    // @ts-ignore - duplex is needed for streaming request bodies
    init.duplex = "half";
  }

  const res = await fetch(backendUrl, init);
  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("connection");
  const responseBody = await res.arrayBuffer();

  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return new Response(null, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  }

  if (!res.ok && responseBody.byteLength === 0) {
    responseHeaders.set("content-type", "application/json");
    return new Response(JSON.stringify({
      error: res.status === 403 ? "No tienes permiso para realizar esta acción." : (res.statusText || `HTTP ${res.status}`),
    }), {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  }

  return new Response(responseBody, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
});
