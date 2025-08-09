import { CATEGORIES, Category } from "./commands";
import { HELP_TEXT } from "./commands";

const URL_REGEX = /https?:\/\/[^\s)]+/gi;

export async function handleUpdate(
  update: any,
  token: string,
  kv: KVNamespace
): Promise<Response> {
  if (!update.message || !update.message.text) return new Response("OK");

  const { message } = update;
  const chatId = message.chat.id;
  const text = message.text.trim();

  // KV persistence helpers
  async function getStore(): Promise<Record<number, Record<string, string[]>>> {
    const raw = await kv.get("store");
    return raw ? JSON.parse(raw) : {};
  }
  async function putStore(store: any) {
    await kv.put("store", JSON.stringify(store));
  }

  // Auto-create store for chat
  const store = await getStore();
  if (!store[chatId]) {
    store[chatId] = Object.fromEntries(CATEGORIES.map(c => [c, []]));
  }

  // ========== COMMANDS ==========
  if (text === "/start") {
    await sendMessage(chatId, "Hello! I'm Zima Blue.", token);
  } else if (text === "/help") {
    await sendMessage(chatId, HELP_TEXT, token, "HTML");
  } else if (text === "/listlinks") {
    const msgs: string[] = [];
    for (const cat of CATEGORIES) {
      const links = store[chatId][cat] || [];
      if (links.length) {
        const html = links
          .map((l, i) => `<b>${i + 1}.</b> <a href="${l}">${l}</a>`)
          .join("\n");
        msgs.push(`<b>/${cat}:</b>\n${html}`);
      }
    }
    const reply = msgs.length ? msgs.join("\n\n") : "No links collected yet.";
    await sendMessage(chatId, reply, token, "HTML");
  } else if (CATEGORIES.some(c => `/${c}` === text.split("@")[0])) {
    const cat = text.split("@")[0].slice(1) as Category;
    const links = store[chatId][cat] || [];
    if (links.length) {
      const html = links
        .map((l, i) => `<b>${i + 1}.</b> <a href="${l}">${l}</a>`)
        .join("\n");
      await sendMessage(chatId, `<b>/${cat}:</b>\n${html}`, token, "HTML");
    } else {
      await sendMessage(chatId, `No links collected yet for /${cat}.`, token);
    }
  } else {
    // ===== Link collection =====
    const match = text.match(/^\/(\w+):?\s*([\s\S]+)/);
    if (match) {
      const category = match[1].toLowerCase();
      if (CATEGORIES.includes(category as Category)) {
        const links = (match[2].match(URL_REGEX) || []).filter(
          (v: any, i: any, a: string | any[]) => a.indexOf(v) === i
        );
        const existing = store[chatId][category] || [];
        const newLinks = links.filter((l: string) => !existing.includes(l));
        if (newLinks.length) {
          store[chatId][category] = [...existing, ...newLinks];
          await putStore(store);
          // Delete original message (needs bot admin rights)
          await fetch(
            `https://api.telegram.org/bot${token}/deleteMessage?chat_id=${chatId}&message_id=${message.message_id}`
          );
        } else if (links.length) {
          await sendMessage(chatId, "Link already present in this category.", token);
        }
      } else {
        await sendMessage(chatId, "Unknown category.", token);
      }
    }
  }
  return new Response("OK");
}

async function sendMessage(
  chatId: number,
  text: string,
  token: string,
  parseMode?: string
) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = { chat_id: chatId, text, disable_web_page_preview: true, ...(parseMode && { parse_mode: parseMode }) };
  await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}