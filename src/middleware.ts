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

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
});
