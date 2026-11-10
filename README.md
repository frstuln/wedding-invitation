# Udari & Piushan — Wedding Invitation

Personalised links + guest admin · 10 June 2027 · Cinnamon Bey Beruwala

A static “old money” style wedding site (burgundy velvet, ivory paper, silver cloche reveal)
that runs on **GitHub Pages**, with a **Supabase** database and a password-protected **admin portal**
for creating one personal link per guest.

```
Guest link:   https://<github-user>.github.io/<repo>/?g=K7QM2XPA9D
Admin portal: https://<github-user>.github.io/<repo>/admin.html
```

---

## 1. How it works

| Piece | Where it lives | What it does |
|---|---|---|
| `index.html` | GitHub Pages | The invitation — 3 pages like the reference: **Home** (wax-seal envelope → Save the Date ticket → Details teaser → Love Story → Kindly Reply), **Details** (`#details`), **RSVP** (`#rsvp`). Reads `?g=CODE`, fetches that guest's name + seat limit, shows “Dear …”, takes the RSVP. |
| `admin.html` | GitHub Pages | Login → add guests (one by one or CSV), copy link / message, send via WhatsApp, see who opened and who replied, export CSV. |
| Supabase (Postgres) | supabase.com, free tier | Stores guests. Row Level Security blocks all public reads; guests can only call two functions with their own code. |
| `js/config.js` | GitHub Pages | All wording, names, date, venues, itinerary, hotels, colours, WhatsApp message. |

**Invite types** (set per guest in the admin)
- **Poruwa ceremony + Reception** — sees the ceremony card, morning itinerary and ceremony countdown.
- **Reception only** — ceremony card, ceremony time and morning itinerary are hidden; wording says “wedding reception”.
- Anyone opening the site without a valid link is treated as reception-only.
- Note: ceremony details live in `config.js`, so someone who opens the page source could still find them.
  To lock this down fully, the ceremony details can be moved into the database and returned only to full guests.

**Security model**
- The Supabase *anon key* in `config.js` is public by design. It cannot read the guest list.
- Guests can only call `get_invite(code)` and `submit_rsvp(code, …)` — they see their own name and seats, nothing else.
- Codes are 10 random characters (≈ 800 trillion combinations), so links can't be guessed.
- Admin access = logged-in Supabase user **and** email listed in the `admins` table.
- Admin preview links use `&preview=1`, so they don't count as the guest opening it.

---

## 2. Setup (≈ 30 minutes)

### Step 1 — Try it locally (demo mode, no database)
```bash
cd wedding-invite
python3 -m http.server 8000
```
- Admin: http://localhost:8000/admin.html (demo data, saved in your browser only)
- Invite (ceremony + reception): http://localhost:8000/?g=DEMOPERERA
- Invite (reception only): http://localhost:8000/?g=DEMORECEPT

### Step 2 — Create the database
1. Create a free project at https://supabase.com (region: Singapore/Mumbai is closest to Sri Lanka).
2. **SQL Editor** → paste `supabase/schema.sql` → Run.
3. Add your admin email(s):
   ```sql
   insert into public.admins (email) values ('you@example.com'), ('partner@example.com');
   ```
4. **Authentication → Users → Add user** → create the same email(s) with a password (tick *Auto confirm*).
5. **Authentication → Sign In / Providers** → turn **off** “Allow new users to sign up”.
6. **Project Settings → API** → copy the *Project URL* and *anon public* key into `js/config.js`.

### Step 3 — Personalise content
Edit `js/config.js`: names, monogram, date, venues + Google Maps links, itinerary, dress code
colours, gifts, hotels, RSVP deadline, WhatsApp message.
Add photos to `assets/` and reference them (`photos.ticket` oval ticket photo, `photos.strip` 3 film-strip frames, `photos.details` 2 polaroids). Black-and-white photos suit the style best. Optional: `assets/og.jpg`
(1200×630) for the WhatsApp link preview, and an mp3 for `music`.

### Step 4 — Publish on GitHub Pages
```bash
git init && git add . && git commit -m "Wedding invitation"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```
GitHub → repo **Settings → Pages** → Source: *Deploy from a branch* → `main` / `root` → Save.
Then set `siteUrl` in `config.js` to the Pages URL and push again.

> Tip: a short repo name makes nicer links (e.g. `lp2027`). A custom domain (e.g. `lakmalandpartner.com`)
> can be added under Settings → Pages → Custom domain.

### Step 5 — Add guests & send
- Add guests in the admin (name as it should appear: “Mr. & Mrs. Perera”, seats = max people allowed).
- Or import `sample-guests.csv`-style CSV from Excel/Google Sheets.
- Click **WhatsApp** (opens a pre-filled chat if a phone number is saved) or **Copy message**.
- Track opens and replies; filter “Not opened yet” to follow up.

---

## 3. Plan & timeline

| When | Task |
|---|---|
| Week 1 | Finalise wording, venues, itinerary, dress code. Pick photos (B&W works best with this style). |
| Week 1 | Supabase + admin login set up, deploy to GitHub Pages, test on Android + iPhone. |
| Week 2 | Build guest list in a spreadsheet (name, seats, side, group, phone) → CSV import. |
| Week 2 | Send to 3–5 friends as a test; check link preview, RSVP, admin counts. |
| Send day | Send invitations in batches by group from the admin (WhatsApp). |
| Ongoing | Weekly: filter *Not opened* / *Pending* and follow up. |
| RSVP deadline | Export CSV → seating plan & final headcount for the caterer. |
| After wedding | Optionally add a thank-you note / photo gallery link to the page. |

---

## 4. Database fields (`guests`)
`display_name`, `invite_type` (full / reception), `max_guests`, `side`, `tag` (group), `phone`, `notes`, `code`,
`opened_count`, `first_opened_at`, `last_opened_at`,
`rsvp_status` (pending / attending / declined), `rsvp_count`, `rsvp_names`, `rsvp_message`, `rsvp_at`.

## 5. Notes
- Supabase free projects can be paused after a long period of inactivity — open the admin occasionally,
  or check Supabase's current free-tier terms.
- Link previews (WhatsApp) are the same for everyone (static site); the personal name appears once opened.
- Want an RSVP deadline lock, meal choices or a Sinhala/Tamil version? Add fields in `schema.sql` +
  `submit_rsvp`, and the matching inputs in `index.html`.

## 6. Files
```
index.html            invitation
admin.html            guest admin portal
css/invite.css        invitation styling
css/admin.css         admin styling
js/config.js          ← edit your content here
js/api.js             Supabase / demo data layer
js/invite.js          invitation logic (opener, countdown, RSVP)
js/admin.js           admin logic (CRUD, CSV, WhatsApp)
supabase/schema.sql   database, security rules, functions
sample-guests.csv     CSV import template
assets/               your photos / music / og.jpg
```

## 7. Photos & credits
Scene photos are free stock from Unsplash (Unsplash License — free for personal use, no attribution required):
- Velvet curtain (opening frame, Details tray) — team voyas · `photo-1508778552286-12d4c6007799`
- Martini on stage (Details page header) — `photo-1773188243511-2eb85126f08b`
- Record on turntable (Kindly Reply) — `photo-1603048588665-791ca8aea617`
- Couple / beach photos in the ticket, film strip and polaroids are **stand-ins** — replace with your own pre-shoot photos.

They currently load from Unsplash's CDN. Before sending invitations, download each one
(open the URL in `js/config.js`, save it into `assets/`) and change the path to e.g. `assets/curtain.jpg`,
so your site doesn't depend on another server.
