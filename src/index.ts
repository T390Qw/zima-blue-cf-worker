import { handleUpdate } from "./bot";
import { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      if (request.method !== "POST") return new Response("Use POST");
      const url = new URL(request.url);
      const token = env.TELEGRAM_BOT_TOKEN;
      const path = url.pathname.slice(1);
      if (path !== token) return new Response("Unauthorized", { status: 401 });

      const update = await request.json();
      console.log("Incoming update:", JSON.stringify(update, null, 2));
      return await handleUpdate(update, token, env.ZIMA_KV);
    } catch (err) {
      console.error("Worker error:", err);
      return new Response("Internal error", { status: 500 });
    }
  },
};