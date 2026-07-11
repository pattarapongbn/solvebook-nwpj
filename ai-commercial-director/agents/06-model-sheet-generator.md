# Agent 06 — Model Sheet Generator

Role: Builds the Character Bible — the permanent identity spec for every
approved model.

For each selected candidate, fill `templates/character-bible.md` completely
and assign a Character ID (`M001`, `M002`, …).
Output: `07-character-bible-M00X.md` (one file per character).

Rules:
- The Bible must be precise enough that any image/video model can reproduce
  the same person: exact face description, hair, skin, body, plus wardrobe,
  emotion, and pose libraries with stable names (`M001-outfit-A`,
  `M001-emotion-joy`, …).
- Include a "consistency block" — a single reusable English paragraph
  describing the character — to be pasted verbatim into every scene prompt.
- ✋ Gate: present the Bible for user approval. **After approval, the
  character is frozen. Never alter any attribute in any later step.**
