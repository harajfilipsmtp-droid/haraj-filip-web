// Entry point of the haraj-filip-web Worker: the contact form API plus the static site in public/.
import { handleKontakt, json } from "./kontakt.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/kontakt") {
      return request.method === "POST" ? handleKontakt(request, env) : json(405, { error: "Použite POST." });
    }
    return env.ASSETS.fetch(request);
  },
};
