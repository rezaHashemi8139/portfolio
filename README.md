# Reza Hashemi — Portfolio (Next.js edition)

A 3D animated portfolio built on **Next.js (App Router)**, with **all content driven by one JSON file** and an **/admin editor** that changes that file (and the uploaded images/PDFs) at runtime — no database.

## Run

```bash
npm install
cp .env.example .env.local     # then set ADMIN_USERNAME, ADMIN_PASSWORD and SESSION_SECRET (see "Admin" below)
npm run dev                    # http://localhost:3000  — editor at /admin
# production
npm run build && npm start
```

## How it works

```
content/
  site.json      ← every text, link, date, SEO field (validated by src/lib/schema.ts)
  uploads/       ← images + résumé PDF managed from /admin, served at /media/<file>
  backups/       ← automatic snapshot of the previous site.json on every save (latest 40)
```

- The public page is **statically generated** from `site.json` (fast, fully crawlable HTML, no JS needed to read it).
- Saving in `/admin` validates the data, snapshots the old file, atomically rewrites `site.json`, then calls `revalidatePath` — the static page, sitemap, robots and social card are regenerated immediately.
- Uploads live in `content/uploads` and are served by a route (`/media/*`), **not** from `public/`, because Next.js only serves `public/` files that existed at build time.
- The 3D scene, GSAP animations, theme switch, cursor, preloader are ported 1:1 as client islands; the markup itself is server-rendered.

## Admin (`/admin`)

This project has a built-in admin page for editing the whole site (texts, links, images, résumé PDF) without touching code. Open **`/admin`** (locally: <http://localhost:3000/admin>); you will be redirected to `/admin/login`.

### Default login

| Field | Default |
| --- | --- |
| Username | `admin` |
| Password | `change-me` |

These come from `.env.example`: once you copy it to `.env.local` (see [Run](#run)) and start the server, you can sign in with `admin` / `change-me`. The username falls back to `admin` even if `ADMIN_USERNAME` is not set, but there is **no built-in password** — without `ADMIN_PASSWORD` and a `SESSION_SECRET` of at least 16 characters the admin stays switched off and `/admin` shows a setup notice.

> **Change the default password (and `SESSION_SECRET`) before deploying.** Anyone who knows `admin` / `change-me` can edit your site.

### Changing the username and password

1. Open `.env.local` (on a server: the environment variables of your host / Docker / process manager).
2. Set your own values:

   ```bash
   ADMIN_USERNAME=my-name
   ADMIN_PASSWORD=a-long-strong-password
   SESSION_SECRET=<16+ random characters>
   ```

   Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. **Restart the server** (`npm run dev` / `npm start`). Environment variables are read at start-up.

Changing the username, the password or `SESSION_SECRET` signs every existing session out, so you will have to log in again. The login is throttled (6 wrong attempts per 15 minutes per address) and the error message never says which of the two was wrong.

### Changing the admin address (URL)

The editor lives at `/admin` by default. To move it, e.g. to `/dashboard`:

1. Rename the folder `src/app/(admin)/admin` → `src/app/(admin)/dashboard`.
2. Replace the `/admin` page paths in these places (keep `/api/admin/...` as it is — that is the API, not the page):

   | File | What to change |
   | --- | --- |
   | `src/admin/LoginForm.tsx` | `window.location.href = '/admin'` |
   | `src/admin/Editor.tsx` | `'/admin/login'` after logout |
   | `src/admin/api.ts` | `'/admin/login'` when the session expires |
   | `src/app/(admin)/dashboard/page.tsx` | `redirect('/admin/login')` |
   | `src/app/(admin)/dashboard/login/page.tsx` | `redirect('/admin')` |
   | `src/app/robots.ts` | `disallow: ['/admin', …]` |
   | `next.config.ts` | `source: '/admin/:path*'` (the no-store / noindex headers) |
3. Restart the server and open `/dashboard`.

A less obvious address is not a replacement for a strong password — the page is protected by the login either way.

### Using the editor

Tabs: Site & SEO, Profile & hero, About, Skills, Experience, Work, Education, Contact, **Files & images** (upload / replace / delete, usage tracking), **Raw JSON**, **History** (restore older versions).
`Ctrl/⌘ + S` saves. Replacing a file keeps its URL, so nothing else needs changing. Deleting a file that is still referenced asks for confirmation.

Security: signed httpOnly + SameSite=Strict cookie, constant-time username + password check, login throttling, same-origin check on every write, every API route re-checks the session, uploads validated by extension **and** magic bytes (SVGs are served sandboxed), strict link-scheme allow-list in the schema, `noindex` + `no-store` on the admin.

### Text markup in the JSON
`*accent*` → accent style (headings), `**bold**` → bold (hero intro). Nothing else is interpreted, so content cannot inject HTML.

## SEO included

`generateMetadata` (title, description, keywords, canonical, robots, Open Graph, Twitter) · JSON-LD (`WebSite`, `ProfilePage`, `Person`) · `sitemap.xml` (with portrait image) · `robots.txt` · generated favicon and fallback social card (`/og`) · `next/font` self-hosted fonts · semantic landmarks, one `<h1>` · full content in the initial HTML.

**Before going live:** set the public address in *Site & SEO → Public address* (or `SITE_URL`), and upload a 1200×630 share image.

## Hosting — important

Because the editor writes files, it needs a **Node server with a persistent disk** (VPS, Docker + volume, Railway/Fly/Render with a disk). It will **not** persist edits on read-only/serverless hosts such as Vercel. Point `CONTENT_DIR` at the persistent volume (it must contain `site.json`; copy the bundled `content/` there once).
Run a single instance (concurrent writes are serialised per process, and edits conflict-check with an ETag).

## Env

| Variable | Purpose |
| --- | --- |
| `ADMIN_USERNAME` | Admin login name; optional, defaults to `admin` |
| `ADMIN_PASSWORD` | Admin login password (required for `/admin`) |
| `SESSION_SECRET` | ≥16 random chars; signs the session cookie |
| `SITE_URL` | Optional; overrides the public address saved in the admin |
| `CONTENT_DIR` | Optional; where `site.json`, `uploads/`, `backups/` live |

## Adding a new editable field

1. Add it to `src/lib/schema.ts` and `content/site.json`.
2. Add one line to `src/admin/tabs.ts` (the form is described as data).
3. Render it in the relevant `src/sections/*.tsx`.
