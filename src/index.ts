export default {
  async fetch(request: Request, env: any): Promise<Response> {
    if (request.method !== "POST") return new Response("Use POST");

    const url = new URL(request.url);
    const path = url.pathname.slice(1);

    // 1. Log the incoming update
    const update = await request.json();
    console.log("Incoming:", JSON.stringify(update, null, 2));

    // 2. Compare tokens
    if (path !== env.TELEGRAM_BOT_TOKEN) {
      console.log("Token mismatch:", path, "vs", env.TELEGRAM_BOT_TOKEN);
      return new Response("Unauthorized", { status: 401 });
    }

    // 3. Call bot logic
    await import("./bot").then(m => m.handleUpdate(update, env.TELEGRAM_BOT_TOKEN, env.ZIMA_KV));
    return new Response("OK");
  },
};