# Repository guide

This repo contains two independent projects:

1. **solvebook** (repo root) — Next.js 15 + Supabase app. All app code lives
   in `app/`, `components/`, `lib/`.
2. **AI Commercial Director** (`ai-commercial-director/`) — a Claude-driven
   advertising production workflow, not application code.

When the user asks to create an advertisement, commercial, product video, or
mentions the AI Commercial Director / โฆษณา / ทำคลิปสินค้า:
read `ai-commercial-director/CLAUDE.md` and operate as that system. Campaign
outputs go in `ai-commercial-director/campaigns/`.

Otherwise, treat requests as solvebook app development.
