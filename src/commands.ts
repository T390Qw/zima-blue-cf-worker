export const CATEGORIES = ["movies", "games", "apps", "videos", "websites", "uncategorized"] as const;
export type Category = typeof CATEGORIES[number];

export const HELP_TEXT =
  "<b>Commands:</b>\n" +
  "/start - Start the bot\n" +
  "/help - Show this help\n" +
  "/listlinks - List all links\n" +
  "/movies - Movie links\n" +
  "/games - Game links\n" +
  "/apps - App links\n" +
  "/videos - Video links\n" +
  "/websites - Website links\n" +
  "/uncategorized - Uncategorized links";