if (typeof globalThis.WebSocket === "undefined") {
  const { WebSocket } = await import("ws");
  globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;
}
