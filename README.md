# Filip Haraj - osobný web

Prezentačný web Filipa Haraja (AI engineer a web developer).

Statický web v čistom HTML, CSS a JavaScripte bez build kroku plus malý Cloudflare Worker
pre kontaktný formulár. Lokálne celé spustíš príkazom `npx wrangler dev`.

## Štruktúra

- `public/` - všetko, čo vidí návštevník
  - `index.html`, `ochrana-osobnych-udajov.html`, `styles.css`, `main.js`, `assets/img/`
- `src/worker.js` - vstupný bod Workera: `/api/kontakt` obslúži formulár, všetko ostatné sú statické súbory
- `src/kontakt.js` - spracovanie dopytu a odoslanie e-mailov
- `src/potvrdenie.js` - šablóna potvrdzovacieho e-mailu pre odosielateľa
- `wrangler.jsonc` - konfigurácia Workera

## Hosting

Web beží na **Cloudflare** ako Worker `haraj-filip-web` so statickými súbormi.
Každý push do vetvy `main` na GitHube spustí build s príkazom `npx wrangler deploy`.

## Kontaktný formulár

Formulár posiela JSON na `/api/kontakt`. Worker skontroluje povinné polia, súhlas
so spracovaním údajov aj skrytú pascu na roboty (`_gotcha`) a cez [Resend](https://resend.com)
odošle dva e-maily: dopyt na `MAIL_TO` a potvrdenie odosielateľovi.

| Premenná | Kde je | Hodnota |
| --- | --- | --- |
| `MAIL_FROM` | `wrangler.jsonc` | `Filip Haraj <kontakt@filipharaj.com>` - doména musí byť overená v Resende |
| `MAIL_TO` | `wrangler.jsonc` | `harajfilip.co@gmail.com` |
| `RESEND_API_KEY` | Cloudflare → haraj-filip-web → Settings → Variables and Secrets (typ Secret); lokálne `.dev.vars` | `re_...` |

Keď kľúč chýba alebo Resend odmietne odoslanie, formulár používateľovi ukáže chybu
a odkáže ho na e-mail.
