# 12 — Export Package: OGERY Camping Fan (TikTok UGC)

- QA status: **PASSED with 1 open input** (2026-07-12)
- Deliverables: 8 scene prompts · Thai voice script · music prompt ·
  burn-in subtitles · editing notes

## QA results
**Product continuity** — PASS. Every scene prompt inherits the locked [P001]
block; OGERY logo + orange/black form enforced; no invented specs anywhere.
**Character continuity** — PASS. Every scene with a person inherits [M001];
outfit-A locked scenes 1–8; approved Bible unchanged.
**Story** — PASS. Hook lands at 0–3s; pains escalate; product introduced
naturally at 7s; benefits shown as visible proof (airflow, rising battery %);
clear CTA at 27–30s; runtime = 30s matches story strategy.
**Technical** — PASS. Each scene prompt is self-contained; 9:16, warm-LED
language and 35mm handheld consistent; voice/music/subtitle kept separate;
all 12 files present; 00-state.md current.

⚠️ **Open input (not a blocker):** no hard specs were provided, so the ad makes
**no numeric claims** (mAh, runtime hours, speeds, IP rating). If you supply
them, insert at the Scene-5 beat and the S5 subtitle to strengthen conversion —
but only real, verified numbers.

## Final export checklist
- [ ] Generate S1–S8 in Google Flow / Veo using `11-flow-prompts.md` (one prompt each)
- [ ] Use a real clean OGERY reference photo as image input so the product stays identical
- [ ] Record/generate Thai VO from the S1–S8 script (M001 voice profile)
- [ ] Add the music bed per the music prompt; align swell to 23s, button to 30s
- [ ] Burn in the Thai subtitles (keep lower 15% clear for the basket)
- [ ] Edit per editing notes (whip-pan S2→S3, match-cut S4→S5, end card)
- [ ] Export 1080×1920 H.264, ~30s, <287MB
- [ ] Final watch-through vs. story checklist (hook ≤3s, CTA present)

## Handoff notes
- Product Sheet (`03`) is prompt-only because the source was a Kalodata
  screenshot. A clean product photo unlocks image-to-image generation for both
  the product sheet and every scene.
- If you later want a **couple version** (C1 Boss + C2 Mind), it reuses this
  screenplay; only add an M002 Character Bible and split the reaction beats.
