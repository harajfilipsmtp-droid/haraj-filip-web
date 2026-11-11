# Filip Haraj - osobný web

Prezentačný web Filipa Haraja (AI engineer a web developer).

Čisté HTML, CSS a JavaScript bez build kroku. Stačí otvoriť `index.html`; kontaktný formulár
ale potrebuje bežiacu funkciu, takže pri vývoji spúšťaj `npx wrangler pages dev .`.

## Štruktúra

- `index.html` - obsah stránky
- `ochrana-osobnych-udajov.html` - povinné informácie o spracúvaní osobných údajov
- `styles.css` - dizajn
- `main.js` - úvodná animácia, hero, detaily projektov, kontaktný formulár
- `assets/img/` - obrázky
- `functions/api/kontakt.js` - Cloudflare Pages Function, ktorá prijme dopyt a pošle e-maily
- `email/potvrdenie.js` - šablóna potvrdzovacieho e-mailu pre odosielateľa

## Hosting

Web beží na **Cloudflare Pages**, nasadzuje sa z vetvy `main` na GitHube.
Build command je prázdny, output directory je koreň (`/`).

## Kontaktný formulár

Formulár posiela JSON na `/api/kontakt`. Funkcia skontroluje povinné polia, súhlas
so spracovaním údajov aj skrytú pascu na roboty (`_gotcha`) a potom cez
[Resend](https://resend.com) odošle dva e-maily: dopyt na `MAIL_TO` a potvrdenie odosielateľovi.

Premenné nastav v Cloudflare Pages (Settings → Variables and secrets), lokálne v `.dev.vars`:

| Premenná | Príklad |
| --- | --- |
| `RESEND_API_KEY` | `re_...` (secret) |
| `MAIL_FROM` | `Filip Haraj <kontakt@filipharaj.com>` - doména musí byť overená v Resende |
| `MAIL_TO` | `harajfilip.co@gmail.com` |

Keď premenné chýbajú, funkcia vráti chybu a formulár o tom používateľa informuje.
