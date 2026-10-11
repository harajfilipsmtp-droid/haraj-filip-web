// Netlify runs this automatically after every verified (non-spam) form submission.
// For the "kontakt" form it e-mails the visitor a confirmation from Filip's Gmail.
//
// Required environment variables (Netlify → Project configuration → Environment variables):
//   GMAIL_USER          harajfilip.co@gmail.com
//   GMAIL_APP_PASSWORD  16-character Gmail app password (Google account → Security → App passwords)
import nodemailer from "nodemailer";
import { subject, text, html } from "../email/potvrdenie.mjs";

export const handler = async (event) => {
  const { payload } = JSON.parse(event.body || "{}");
  if (payload?.form_name !== "kontakt") return { statusCode: 200, body: "ignored" };

  const { meno = "", email = "" } = payload.data || {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { statusCode: 200, body: "no valid e-mail" };

  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("GMAIL_USER / GMAIL_APP_PASSWORD are not set – confirmation e-mail skipped");
    return { statusCode: 500, body: "mail not configured" };
  }

  const transport = nodemailer.createTransport({
    service: "gmail",
    // Google shows app passwords in groups of four ("abcd efgh …"); the spaces are not part of it
    auth: { user: GMAIL_USER.trim(), pass: GMAIL_APP_PASSWORD.replace(/\s+/g, "") },
  });

  const name = meno.trim() || "";
  await transport.sendMail({
    from: `"Filip Haraj" <${GMAIL_USER}>`,
    to: email,
    replyTo: GMAIL_USER,
    subject,
    text: text(name),
    html: html(name),
  });

  return { statusCode: 200, body: "sent" };
};
