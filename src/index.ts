import { handleUpdate } from "./bot";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    if (request.method !== "POST") return new Response("Use POST");

    const url = new URL(request.url);
    const pathToken = url.pathname.slice(1);

    if (pathToken !== env.TELEGRAM_BOT_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }

    const update = await request.json();
    await handleUpdate(update, env.TELEGRAM_BOT_TOKEN, env.ZIMA_KV);
    return new Response("OK");
  },
};