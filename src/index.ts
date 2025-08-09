import { CATEGORIES, Category, HELP_TEXT } from "./commands";

type TelegramUpdate = {
  update_id?: number;
  message?: {
    text?: string;
    chat: { id: number };
  };
};

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    if (request.method !== "POST") return new Response("Use POST");

    const url = new URL(request.url);
    const pathToken = url.pathname.slice(1);
    if (pathToken !== env.TELEGRAM_BOT_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }

    const update = await request.json() as TelegramUpdate;
    const { message } = update;
    if (!message?.text) return new Response("OK");

    const text = message.text.trim();
    const chatId = message.chat.id;

    // Plain commands
    switch (text.split("@")[0]) {
      case "/start":
        await sendMessage(chatId, "Hello! I'm Zima Blue.", env.TELEGRAM_BOT_TOKEN);
        break;
      case "/help":
        await sendMessage(chatId, HELP_TEXT, env.TELEGRAM_BOT_TOKEN, "HTML");
        break;
      case "/listlinks":
        await listAllLinks(chatId, env.TELEGRAM_BOT_TOKEN, env.ZIMA_KV);
        break;
    }

    // Category link collection
    const match = text.match(/^\/(\w+):?\s*([\s\S]+)/);
    if (match) {
      const category = match[1].toLowerCase();
      if (CATEGORIES.includes(category as Category)) {
        await collectLinks(chatId, category, match[2], env.TELEGRAM_BOT_TOKEN, env.ZIMA_KV);
        return new Response("OK");
      }
    }

    // Category display
    const cat = text.slice(1);
    if (CATEGORIES.includes(cat as Category)) {
      await showCategory(chatId, cat, env.TELEGRAM_BOT_TOKEN, env.ZIMA_KV);
      return new Response("OK");
    }

    return new Response("OK");
  },
};

// ---------- helpers ----------
async function sendMessage(chatId: number, text: string, token: string, parseMode?: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode, disable_web_page_preview: true }),
  });
}

async function listAllLinks(chatId: number, token: string, kv: any) {
  const store = JSON.parse((await kv.get("store")) || "{}");
  const msgs: string[] = [];
  for (const cat of CATEGORIES) {
    const links = store[chatId]?.[cat] || [];
    if (links.length) {
      const html = links.map((l: any, i: number) => `<b>${i + 1}.</b> <a href="${l}">${l}</a>`).join("\n");
      msgs.push(`<b>/${cat}:</b>\n${html}`);
    }
  }
  const reply = msgs.length ? msgs.join("\n\n") : "No links collected yet.";
  await sendMessage(chatId, reply, token, "HTML");
}

async function collectLinks(chatId: number, category: string, text: string, token: string, kv: any) {
  const store = JSON.parse((await kv.get("store")) || "{}");
  if (!store[chatId]) store[chatId] = Object.fromEntries(CATEGORIES.map(c => [c, []]));
  const links = (text.match(/https?:\/\/[^\s)]+/gi) || []).filter((v, i, a) => a.indexOf(v) === i);
  const existing = store[chatId][category] || [];
  const newLinks = links.filter(l => !existing.includes(l));
  if (newLinks.length) {
    store[chatId][category].push(...newLinks);
    await kv.put("store", JSON.stringify(store));
  } else if (links.length) {
    await sendMessage(chatId, "Link already present in this category.", token);
  }
}

async function showCategory(chatId: number, category: string, token: string, kv: any) {
  const store = JSON.parse((await kv.get("store")) || "{}");
  const links = store[chatId]?.[category] || [];
  if (links.length) {
    const html = links.map((l: any, i: number) => `<b>${i + 1}.</b> <a href="${l}">${l}</a>`).join("\n");
    await sendMessage(chatId, `<b>/${category}:</b>\n${html}`, token, "HTML");
  } else {
    await sendMessage(chatId, `No links collected yet for /${category}.`, token);
  }
}