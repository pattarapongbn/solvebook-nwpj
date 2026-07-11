# Production Pipeline — 12-Step State Machine

State lives in `campaigns/<slug>/00-state.md`. Update it after every step.
Steps run in order. ✋ = approval gate (stop and wait for the user).

## STEP 1 — Product Intake  (Orchestrator)
Receive: product images (required), product URL / marketplace URL (optional).
Analyze: category, brand style, packaging, colors, features, benefits, target customer.
If information is missing, ask only the minimum required questions.
→ Output: `01-intake.md`

## STEP 2 — Product Analysis  (Product Analyst)
→ Output: `02-product-analysis.md` — Product Summary, Customer Avatar,
Pain Points, Desired Outcome, Emotional Trigger, Objections,
Competitive Position, Marketing Angle.

## STEP 3 — Product Sheet  (Product Sheet Generator)
Generate production-ready reference assets (images if tools available,
otherwise prompts): Hero Shot, Front, Side, Top, 45°, Macro, Lifestyle,
Transparent PNG, Luxury Version, White Background Version.
Assign asset IDs: `P001-hero`, `P001-front`, …
→ Output: `03-product-sheet.md`

## STEP 4 — Campaign Style  ✋ (Campaign Strategist)
Present style options and let the user choose one:
TV Direct · Cinematic · Luxury · Apple · Nike · Documentary ·
TikTok UGC · Comedy · Mini Movie · Review
→ Record choice in `00-state.md`

## STEP 5 — Human Models?  ✋ (Casting Director)
Ask: "Do you want human models?" — No → skip to STEP 8. Yes → continue.

## STEP 6 — AI Casting  ✋ (Casting Director)
Generate a contact sheet of candidate models fit for the campaign.
For each: Name, Age, Style, Personality, Suitability Score.
User selects one or more.
→ Output: `06-casting.md`

## STEP 7 — Character Bible  ✋ (Model Sheet Generator)
For every selected model build a full Character Bible
(`templates/character-bible.md`) and assign a Character ID (M001, M002, …).
User approves. **After approval the character can never change.**
→ Output: `07-character-bible-M00X.md`

## STEP 8 — Story Strategy  (Campaign Strategist)
Select the best advertising framework for the product + style:
PAS · AIDA · BAB · TV Direct · UGC · Story · Problem → Solution.
Justify the choice in one paragraph.
→ Output: `08-story-strategy.md`

## STEP 9 — Screenplay  (Screenwriter)
Director-level screenplay. Hook within 3 seconds, escalate emotion,
introduce product naturally, prove benefits, end with CTA.
Every scene: number, duration, location, actors, dialogue, camera, lens,
lighting, emotion, sound, transitions, purpose, expected viewer emotion.
→ Output: `09-screenplay.md`

## STEP 10 — Storyboard  (Storyboard Director)
Numbered scenes; every scene references Character IDs and Product Asset IDs.
→ Output: `10-storyboard.md`

## STEP 11 — Prompt Builder  (Prompt Builder)
Convert every storyboard scene into an independent Google Flow / Veo prompt.
Enforce consistency: character, product, wardrobe, lighting, camera language.
→ Output: `11-flow-prompts.md`

## STEP 12 — QA + Export  (QA Director)
Run `templates/qa-checklist.md` over everything. Fix continuity breaks.
Then export the final package: scene prompts, voice prompts, music prompts,
subtitle prompts, editing notes, final export checklist.
→ Output: `12-export-package.md`
