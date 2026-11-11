// Cloudflare Pages Function behind POST /api/kontakt - replaces Netlify Forms.
// It e-mails the inquiry to Filip and sends the visitor the confirmation.
//
// Environment variables (Cloudflare Pages -> Settings -> Variables and Secrets):
//   RESEND_API_KEY  secret from resend.com
//   MAIL_FROM       verified sender, e.g. "Filip Haraj <kontakt@filipharaj.com>"
//   MAIL_TO         where inquiries land, e.g. harajfilip.co@gmail.com
import { subject as confirmSubject, text as confirmText, html as confirmHtml } from "../../email/potvrdenie.js";

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

const esc = (value = "") =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

async function readFields(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return await request.json();
  const form = await request.formData();
  const out = {};
  for (const [key, value] of form.entries()) {
    out[key] = key === "sluzby" && out[key] ? `${out[key]}, ${value}` : value;
  }
  return out;
}

async function send(apiKey, message) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

function inquiryHtml(f) {
  const row = (label, value) =>
    value ? `<tr><td style="padding:6px 16px 6px 0;color:#55565d;">${label}</td><td style="padding:6px 0;"><strong>${esc(value)}</strong></td></tr>` : "";
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#0e0f13;">
<h2 style="margin:0 0 18px;font-size:20px;">Nový dopyt z webu</h2>
<table style="border-collapse:collapse;">
${row("Meno", f.meno)}${row("E-mail", f.email)}${row("Telefón", f.telefon)}${row("Firma", f.firma)}${row("Služby", f.sluzby)}
</table>
<p style="margin:18px 0 6px;color:#55565d;">Správa</p>
<p style="margin:0;white-space:pre-wrap;">${esc(f.sprava)}</p>
</div>`;
}

export async function onRequestPost({ request, env }) {
  let f;
  try {
    f = await readFields(request);
  } catch {
    return json(400, { error: "Neplatné dáta." });
  }

  if (f._gotcha) return json(200, { ok: true }); // bot filled the hidden field

  const meno = (f.meno || "").trim();
  const email = (f.email || "").trim();
  const sprava = (f.sprava || "").trim();
  if (!meno || !sprava || !isEmail(email)) return json(400, { error: "Vyplňte prosím povinné polia." });
  if (!f.suhlas) return json(400, { error: "Bez súhlasu so spracovaním osobných údajov dopyt odoslať nemôžem." });

  const { RESEND_API_KEY, MAIL_FROM, MAIL_TO } = env;
  if (!RESEND_API_KEY || !MAIL_FROM || !MAIL_TO) {
    console.error("RESEND_API_KEY / MAIL_FROM / MAIL_TO are not set");
    return json(500, { error: "Odosielanie e-mailov nie je nastavené." });
  }

  // The inquiry itself must arrive; the visitor's confirmation is a nice-to-have.
  try {
    await send(RESEND_API_KEY, {
      from: MAIL_FROM,
      to: [MAIL_TO],
      reply_to: email,
      subject: `Nový dopyt z webu - ${meno}`,
      html: inquiryHtml({ ...f, meno, email, sprava }),
    });
  } catch (err) {
    console.error("inquiry e-mail failed", err);
    return json(502, { error: "Odoslanie zlyhalo." });
  }

  try {
    await send(RESEND_API_KEY, {
      from: MAIL_FROM,
      to: [email],
      reply_to: MAIL_TO,
      subject: confirmSubject,
      text: confirmText(meno),
      html: confirmHtml(meno),
    });
  } catch (err) {
    console.error("confirmation e-mail failed", err);
  }

  return json(200, { ok: true });
}

// A GET on this path is never useful, so answer it plainly instead of with the site.
export const onRequestGet = () => json(405, { error: "Použite POST." });
