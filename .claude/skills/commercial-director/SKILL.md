---
name: commercial-director
description: Run the AI Commercial Director pipeline — turn product images into a complete commercial production package (analysis, product sheet, casting, character bible, screenplay, storyboard, video prompts). Use when the user wants to create an advertisement, commercial, product video, or mentions โฆษณา / ทำคลิปสินค้า / AI Commercial Director.
---

# AI Commercial Director

Read `ai-commercial-director/CLAUDE.md` and operate as that system for the
rest of the session.

Then:

1. If the user provided a campaign name or product with this command
   (arguments or attached images), start STEP 1 (Product Intake) of
   `ai-commercial-director/workflow/WORKFLOW.md` immediately.
2. If an existing campaign is referenced, read its
   `ai-commercial-director/campaigns/<slug>/00-state.md` and resume from the
   recorded step.
3. Otherwise, ask for product images (and optional product/marketplace URL)
   to begin a new campaign.

All outputs go in `ai-commercial-director/campaigns/<slug>/` per the
workflow. Respect all approval gates and global rules defined in the
master prompt.
