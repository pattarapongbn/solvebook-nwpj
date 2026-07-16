# LumpuFarm Publisher

Self-hosted service that turns agricultural market data (JSON from **n8n**) into
polished social media graphics. It renders HTML/CSS templates with headless
Chromium (Playwright), returns the PNG directly in the HTTP response, and keeps
a copy of every image on disk. No paid services, no external APIs required.

```
n8n ──POST JSON──▶ LumpuFarm Publisher ──▶ PNG (1080×1350)
                        │
                        ├─ saves storage/images/2026-07-16-0630.png
                        └─ ready for Facebook Graph API publishing
```

---

## Contents

1. [Installation](#installation)
2. [Docker](#docker)
3. [API](#api)
4. [JSON Examples](#json-examples)
5. [Templates](#templates)
6. [Folder Structure](#folder-structure)
7. [Customization](#customization)
8. [Facebook Graph API](#facebook-graph-api)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Installation

### Docker (recommended)

Requires Docker + Docker Compose. One command:

```bash
cp .env.example .env       # optional — defaults work out of the box
docker compose up -d
```

The API is now available at `http://localhost:3000`. Verify:

```bash
curl http://localhost:3000/health
# {"status":"ok","uptime":12.3}
```

### Local (without Docker)

Requires Node.js ≥ 22.

```bash
npm install
npx playwright install chromium   # download the browser once
npm start                          # or: npm run dev (auto-restart)
```

---

## Docker

- The image is based on `mcr.microsoft.com/playwright:v1.49.1-noble`, so
  Chromium and all rendering libraries are preinstalled. The image tag must
  match the `playwright` version in `package.json` — bump both together.
- `./storage/images` and `./storage/logs` are bind-mounted, so generated
  images and logs survive rebuilds (`docker compose down && up`).
- `shm_size: 1gb` is set because Chromium needs more shared memory than
  Docker's 64 MB default.
- A `HEALTHCHECK` hits `/health` every 30 s; `docker ps` shows the status.

Common operations:

```bash
docker compose up -d --build   # rebuild after code changes
docker compose logs -f         # follow logs
docker compose down            # stop
```

---

## API

### `POST /render`

Main endpoint. Accepts market data JSON, responds with the generated PNG
(`Content-Type: image/png`). The image is also saved to `storage/images/`.

| Response header      | Meaning                              |
| -------------------- | ------------------------------------ |
| `X-Image-Filename`   | Filename used on disk                |
| `X-Template`         | Template that was rendered           |

Request fields:

| Field      | Type    | Required | Notes                                        |
| ---------- | ------- | -------- | -------------------------------------------- |
| `template` | string  | no       | `facebook` (default), `instagram-story`, `telegram`, `future` |
| `date`     | string  | yes      | Free-form Thai date, e.g. `"16 กรกฎาคม 2569"` |
| `updated`  | string  | no       | `"HH:MM"`; shown in header and used in filename |
| `title`    | string  | yes      | Main headline                                |
| `subtitle` | string  | no       | Small caps line under the title              |
| `sources`  | string  | no       | Footer attribution line                      |
| `items`    | array   | yes      | Commodity list (see below)                   |

Each item:

| Field      | Type            | Required | Notes                                  |
| ---------- | --------------- | -------- | -------------------------------------- |
| `name`     | string          | yes      | Commodity name (auto-fitted, never overflows) |
| `location` | string          | no       | Province                               |
| `price`    | string / number | yes      | Displayed as-is (keep your own formatting) |
| `unit`     | string          | no       | e.g. `"บาท/กก."`                        |
| `change`   | number          | no       | Percent change; drives arrow + color (green ▲ / red ▼ / gray ▬). Default `0`. |

Errors return JSON: `400` (validation, with a `details` array) or `500` (render failure).

### `GET /templates`

Lists available templates with dimensions — useful for building n8n dropdowns.

### `GET /images/:filename`

Serves a previously generated image, e.g. `/images/2026-07-16-0630.png`.

### `GET /health`

Liveness probe.

### `POST /publish/facebook`

Publishes a stored image to a Facebook Page (returns `501` until
`FB_PAGE_ID` / `FB_ACCESS_TOKEN` are configured — see
[Facebook Graph API](#facebook-graph-api)).

```json
{ "fileName": "2026-07-16-0630.png", "caption": "ราคาพืชผลวันนี้ 🌾" }
```

---

## JSON Examples

### Minimal

```json
{
  "date": "16 กรกฎาคม 2569",
  "title": "ราคาพืชผลเกษตรไทย",
  "items": [
    { "name": "ข้าวหอมมะลิ", "price": "14,500", "unit": "บาท/ตัน", "change": 2.1 }
  ]
}
```

### Full (Facebook poster)

```json
{
  "template": "facebook",
  "date": "16 กรกฎาคม 2569",
  "updated": "06:30",
  "title": "ราคาพืชผลเกษตรไทย",
  "subtitle": "Daily Market Update",
  "sources": "ที่มา: กรมการค้าภายใน / ตลาดไท",
  "items": [
    { "name": "ข้าวหอมมะลิ", "location": "อุบลราชธานี", "price": "14,500", "unit": "บาท/ตัน", "change": 2.1 },
    { "name": "ยางพารา", "location": "สุราษฎร์ธานี", "price": "62.50", "unit": "บาท/กก.", "change": 0.8 },
    { "name": "ปาล์มน้ำมัน", "location": "กระบี่", "price": "5.80", "unit": "บาท/กก.", "change": -1.4 },
    { "name": "มันสำปะหลังโรงงานเชื้อแป้ง 25%", "location": "นครราชสีมา", "price": "3.15", "unit": "บาท/กก.", "change": 0 },
    { "name": "ข้าวโพดเลี้ยงสัตว์", "location": "เพชรบูรณ์", "price": "10.20", "unit": "บาท/กก.", "change": 1.2 },
    { "name": "ทุเรียนหมอนทอง", "location": "จันทบุรี", "price": "135", "unit": "บาท/กก.", "change": -2.6 }
  ]
}
```

### curl

```bash
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  -d @payload.json \
  --output poster.png
```

### n8n

Use an **HTTP Request** node:

- Method: `POST`, URL: `http://lumpufarm-publisher:3000/render`
  (service name if n8n runs in the same Docker network, otherwise host IP)
- Body Content Type: `JSON`, body = your assembled market data
- **Response Format: `File`** — the node output is the PNG binary, ready to
  pass to a Facebook/LINE/Telegram node or to save.

The footer summary (increased/decreased/unchanged counts) and the
"highest increase / highest decrease" strip are computed automatically from
`items` — you never send them.

---

## Templates

| Name              | Size        | Layout                                   |
| ----------------- | ----------- | ---------------------------------------- |
| `facebook`        | 1080 × 1350 | 2-column card grid (feed 4:5) — default  |
| `instagram-story` | 1080 × 1920 | Single-column, large type (9:16)         |
| `telegram`        | 1280 × 720  | Compact 3-column banner (16:9)           |
| `future`          | 1080 × 1080 | Square (1:1) base for new formats        |

Recommended item counts: 4–8 (facebook/future), 4–6 (instagram-story),
3–6 (telegram). The grid shares the available height between rows, and long
names auto-shrink, so other counts still render — they just get denser.

### Adding a template

1. Copy `templates/future.html` → `templates/my-format.html` and change its
   stylesheet link.
2. Copy `styles/future.css` → `styles/my-format.css` and adjust sizes.
3. Register it in `src/config.js` → `TEMPLATES` with its dimensions.

That's all — the shared component scripts handle rendering.

---

## Folder Structure

```
lumpufarm-publisher/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── .env.example
├── src/
│   ├── server.js               # Express app, routes wiring, shutdown
│   ├── renderer.js             # Playwright: HTML → PNG
│   ├── config.js               # paths, template registry, env settings
│   ├── routes/
│   │   ├── render.js           # POST /render
│   │   └── publish.js          # POST /publish/facebook
│   ├── services/
│   │   ├── marketStats.js      # totals, highest increase/decrease
│   │   └── facebookPublisher.js# Graph API photo publishing
│   └── utils/
│       ├── validate.js         # request validation
│       ├── storage.js          # filename + collision-safe saving
│       └── logger.js           # console + storage/logs/app.log
├── templates/
│   ├── facebook.html           # one HTML file per output format
│   ├── instagram-story.html
│   ├── telegram.html
│   ├── future.html
│   └── scripts/                # shared vanilla-JS (ES modules)
│       ├── poster.js           # render entry point (window.LumpuFarm)
│       ├── components.js       # card / badge / stat-pill builders + icon map
│       └── autofit.js          # shrink-to-fit for long Thai names
├── styles/
│   ├── base.css                # design tokens + reusable components
│   └── <template>.css          # sizing/spacing per format
├── assets/
│   ├── logo.png  background.png
│   ├── icons/                  # commodity SVG icons (rice, rubber, …)
│   └── fonts/                  # Noto Sans Thai (Regular + Bold)
└── storage/
    ├── images/                 # every generated PNG (e.g. 2026-07-16-0630.png)
    └── logs/                   # app.log
```

Architecture: **routes** validate and orchestrate → **services** hold business
logic → **renderer/utils** do I/O. Templates are pure presentation: HTML
structure + external CSS + external JS, no inline styles or scripts.

### Filenames

`YYYY-MM-DD-HHMM.png` — date from the server clock in `TZ` (default
`Asia/Bangkok`), time from the payload's `updated` field (fallback: server
time). Collisions never overwrite; a `-2`, `-3`, … suffix is appended.

### Live template preview

Open any `templates/*.html` file directly in a browser — it renders built-in
preview data, so you can iterate on design without running the server
(launch Chrome with `--allow-file-access-from-files` since the scripts are
ES modules loaded over `file://`).

---

## Customization

- **Colors / branding** — edit the design tokens at the top of
  `styles/base.css` (`--green-*`, `--gold`, `--up`, `--down`, radii, shadows).
  Every template inherits them.
- **Logo** — replace `assets/logo.png` (square, ≥ 256 px).
- **Background** — replace `assets/background.png` or remove the `url(...)`
  layer from `.poster` in `base.css`.
- **Fonts** — drop new `.ttf` files into `assets/fonts/` and update the
  `@font-face` rules in `base.css`.
- **Commodity icons** — add an SVG to `assets/icons/` and a keyword rule to
  `ICON_RULES` in `templates/scripts/components.js`. Unmatched names get
  `default.svg`.
- **Labels** — the Thai UI strings (`ประจำวันที่`, `ราคาขึ้น`, …) live in the
  template HTML and `templates/scripts/poster.js`.

---

## Facebook Graph API

The pipeline is prepared — publishing activates with two env vars:

1. Create a Facebook App and get a **Page access token** with the
   `pages_manage_posts` and `pages_read_engagement` permissions
   (use a long-lived token for unattended posting).
2. Set in `.env`:

   ```
   FB_PAGE_ID=1234567890
   FB_ACCESS_TOKEN=EAAB...
   ```

3. `docker compose up -d` again, then:

   ```bash
   curl -X POST http://localhost:3000/publish/facebook \
     -H "Content-Type: application/json" \
     -d '{"fileName":"2026-07-16-0630.png","caption":"ราคาพืชผลวันนี้ 🌾"}'
   ```

Typical n8n flow: `Schedule → fetch prices → POST /render → POST /publish/facebook`.

---

## Deployment

Any Docker host works (home server, VPS, NAS):

```bash
git clone <your-repo>
cd lumpufarm-publisher
cp .env.example .env
docker compose up -d
```

Recommendations:

- Keep the service on a private network / behind a firewall — it has no
  authentication by design (internal tool). If it must be reachable publicly,
  put a reverse proxy (Caddy/nginx) with basic auth or an IP allowlist in
  front.
- `restart: unless-stopped` is already configured, so it survives reboots.
- Disk usage: each poster is ~200–500 KB. Prune old images occasionally, e.g.
  `find storage/images -name '*.png' -mtime +90 -delete` in a cron job.

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `docker compose up` builds but the container restarts | Check `docker compose logs`. Most common: port 3000 already in use — set `PORT=3001` in `.env`. |
| Chromium crashes / blank images | Ensure `shm_size: 1gb` is present in `docker-compose.yml` (it is by default). |
| `400 Invalid payload` | The response's `details` array lists exactly which fields are wrong. |
| Thai text shows as boxes (□□□) | The bundled Noto Sans Thai fonts are missing — make sure `assets/fonts/*.ttf` were copied into the image (rebuild with `--build`). |
| Long names look small | That's the auto-fit doing its job. Shorten the name or use a wider template. |
| Running locally: `browserType.launch: Executable doesn't exist` | Run `npx playwright install chromium`, or point `CHROMIUM_EXECUTABLE_PATH` at a system Chromium. |
| `501` from `/publish/facebook` | `FB_PAGE_ID` / `FB_ACCESS_TOKEN` are not set — see [Facebook Graph API](#facebook-graph-api). |
| Images not persisted after rebuild | Keep the `./storage/...` volume mounts from the provided `docker-compose.yml`. |
| Slow first request (~2 s) | Chromium launches lazily on the first render and is reused afterwards (~300–600 ms per image). |

---

## License

MIT — internal LumpuFarm tooling.
