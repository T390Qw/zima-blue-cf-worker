export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  ZIMA_KV: KVNamespace;
}

export interface LinkStore {
  [chatId: number]: {
    [category: string]: string[]; // deduplicated links
  };
}