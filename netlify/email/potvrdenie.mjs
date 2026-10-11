// Automatic confirmation e-mail sent to everyone who submits the contact form.
// Table layout + inline styles so it renders the same in Gmail, Outlook and Apple Mail.

const SITE = "https://filipharaj.com";

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const subject = "Ďakujem za váš dopyt – Filip Haraj";

export function text(meno) {
  return `Dobrý deň ${meno},

ďakujem za vyplnenie formulára na filipharaj.com. Váš dopyt som úspešne zaregistroval.

Čo bude nasledovať?
1. Vaše zadanie si teraz prečítam a premyslím najlepšie technické riešenie.
2. Ozvem sa vám najneskôr do 24 hodín s návrhom ďalšieho postupu, prípadne s upresňujúcimi otázkami.

Ak by ste medzitým chceli niečo doplniť, môžete mi odpovedať priamo na tento e-mail.

S pozdravom,

Filip Haraj
+421 902 245 566
www.filipharaj.com`;
}

// `assets` lets a preview swap the hosted image URLs for inline (cid:) images
export function html(meno, assets = {}) {
  const img = {
    photo: `${SITE}/assets/img/email/filip.jpg`,
    linkedin: `${SITE}/assets/img/email/linkedin.png`,
    instagram: `${SITE}/assets/img/email/instagram.png`,
    ...assets,
  };
  const name = escapeHtml(meno);
  const ink = "#0e0f13", muted = "#55565d", blue = "#2b3ff0", bg = "#edece7", line = "#cfcec7";
  const sans = "'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
  const display = "'Inter Tight', 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
  const mono = "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace";

  const step = (num, body) => `
              <tr>
                <td width="44" valign="top" style="padding:0 0 18px;">
                  <div style="width:30px;height:30px;line-height:30px;border-radius:50%;background:${blue};color:#ffffff;text-align:center;font-family:${mono};font-size:12px;font-weight:600;">${num}</div>
                </td>
                <td valign="top" style="padding:4px 0 18px;font-family:${sans};font-size:15px;line-height:1.6;color:${ink};">${body}</td>
              </tr>`;

  return `<!doctype html>
<html lang="sk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
  <style>
    @media (max-width: 620px) {
      .wrap { padding: 20px 12px !important; }
      .card { padding: 30px 22px !important; }
      .h1 { font-size: 28px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Váš dopyt som úspešne zaregistroval. Ozvem sa vám najneskôr do 24 hodín.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bg};">
    <tr>
      <td class="wrap" align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

          <!-- Brand -->
          <tr>
            <td style="padding:0 4px 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${display};font-size:20px;font-weight:800;letter-spacing:-0.5px;color:${ink};">Filip Haraj</td>
                  <td align="right" style="font-family:${mono};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:${muted};">Softvérové riešenia na mieru</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card with the site's blue offset shadow -->
          <tr>
            <td style="padding:0 6px 6px 0;background:${blue};border-radius:12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1.5px solid ${ink};border-radius:10px;">
                <tr>
                  <td class="card" style="padding:40px 40px 34px;">

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:6px 12px;border-radius:99px;background:#e5f6ea;font-family:${mono};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#17803d;">&#10003;&nbsp; Dopyt prijatý</td>
                      </tr>
                    </table>

                    <h1 class="h1" style="margin:22px 0 18px;font-family:${display};font-size:34px;line-height:1.08;font-weight:800;letter-spacing:-1.2px;color:${ink};">Dobrý deň <span style="color:${blue};">${name}</span>,</h1>

                    <p style="margin:0 0 30px;font-family:${sans};font-size:16px;line-height:1.65;color:${muted};">
                      ďakujem za vyplnenie formulára na <a href="${SITE}" style="color:${ink};font-weight:600;text-decoration:none;border-bottom:1.5px solid ${blue};">filipharaj.com</a>. Váš dopyt som úspešne zaregistroval.
                    </p>

                    <p style="margin:0 0 16px;font-family:${mono};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${ink};">Čo bude nasledovať?</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${step("01", "Vaše zadanie si teraz prečítam a premyslím najlepšie technické riešenie.")}${step("02", "Ozvem sa vám <strong>najneskôr do 24&nbsp;hodín</strong> s návrhom ďalšieho postupu, prípadne s upresňujúcimi otázkami.")}
                    </table>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0;">
                      <tr>
                        <td style="padding:16px 18px;background:${bg};border-radius:8px;font-family:${sans};font-size:14px;line-height:1.6;color:${muted};">
                          Ak by ste medzitým chceli niečo doplniť, môžete mi <strong style="color:${ink};">odpovedať priamo na tento e-mail</strong>.
                        </td>
                      </tr>
                    </table>

                    <!-- Signature -->
                    <p style="margin:32px 0 18px;font-family:${sans};font-size:15px;color:${muted};">S pozdravom,</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${line};padding-top:20px;" width="100%">
                      <tr>
                        <td width="84" valign="middle" style="padding-top:20px;">
                          <img src="${img.photo}" width="68" height="68" alt="Filip Haraj" style="display:block;width:68px;height:68px;border-radius:50%;border:0;" />
                        </td>
                        <td valign="middle" style="padding-top:20px;">
                          <div style="font-family:${display};font-size:18px;font-weight:800;letter-spacing:-0.4px;color:${ink};">Filip Haraj</div>
                          <div style="margin:2px 0 6px;font-family:${mono};font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${blue};">AI engineer &amp; web developer</div>
                          <div style="font-family:${sans};font-size:14px;line-height:1.6;">
                            <a href="tel:+421902245566" style="color:${ink};text-decoration:none;">+421 902 245 566</a><br />
                            <a href="${SITE}" style="color:${blue};text-decoration:none;font-weight:600;">www.filipharaj.com</a>
                          </div>
                        </td>
                        <td align="right" valign="middle" style="padding-top:20px;white-space:nowrap;">
                          <a href="https://www.linkedin.com/in/filip-haraj-3b7b89389/" style="text-decoration:none;"><img src="${img.linkedin}" width="32" height="32" alt="LinkedIn" style="display:inline-block;width:32px;height:32px;border:0;border-radius:7px;" /></a>
                          &nbsp;
                          <a href="https://www.instagram.com/_filippppp.qo_/" style="text-decoration:none;"><img src="${img.instagram}" width="32" height="32" alt="Instagram" style="display:inline-block;width:32px;height:32px;border:0;border-radius:7px;" /></a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 10px 0;font-family:${sans};font-size:12px;line-height:1.6;color:${muted};">
              Tento e-mail vám prišiel automaticky, pretože ste vyplnili formulár na
              <a href="${SITE}" style="color:${muted};">filipharaj.com</a>.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
