# AI Commercial Director

ระบบ AI Advertising Pipeline ที่เปลี่ยน "รูปสินค้า" ให้กลายเป็น "แพ็กเกจงานโปรดักชันโฆษณาพร้อมใช้" — วิเคราะห์สินค้า, สร้าง Product Sheet, แคสติ้งนายแบบ/นางแบบ AI, เขียนบท, ทำ Storyboard และแปลงเป็น Video Generation Prompts (Google Flow / Veo) แบบครบวงจร

> This is a Claude-driven workflow project, not an application codebase.
> Claude acts as the **Lead AI System Architect / Commercial Director** and
> orchestrates ten specialist agents through a 12-step production pipeline.

## วิธีใช้งาน (How to use)

1. เปิด Claude Code session ใน repo นี้
2. บอก Claude ว่าต้องการทำโฆษณา แล้วแนบ**รูปสินค้า** (และลิงก์สินค้า/marketplace ถ้ามี)
3. Claude จะโหลด `CLAUDE.md` ของโปรเจคนี้และพาเดินตาม pipeline ทีละขั้น:
   - ถามเฉพาะข้อมูลที่จำเป็นจริง ๆ
   - หยุดรอการอนุมัติ (approval gate) ในจุดสำคัญ: Campaign Style, Casting, Character Bible
4. ผลลัพธ์ของแต่ละแคมเปญจะถูกเก็บใน `campaigns/<ชื่อแคมเปญ>/` เป็นไฟล์ markdown ตาม template

ถ้ามี MCP tools สำหรับ generate ภาพ/วิดีโอ (เช่น Higgsfield) เชื่อมต่ออยู่ Claude สามารถ
generate ภาพ Product Sheet, Contact Sheet และวิดีโอจริงได้เลย — ถ้าไม่มี จะส่งมอบเป็น
production-ready prompts แทน

## โครงสร้างโปรเจค

```
ai-commercial-director/
├── CLAUDE.md            ← Master system prompt (Claude โหลดไฟล์นี้เพื่อสวมบทบาท)
├── workflow/
│   └── WORKFLOW.md      ← State machine 12 ขั้นตอน + approval gates
├── agents/              ← Prompt ของ agent ทั้ง 10 ตัว
│   ├── 01-orchestrator.md
│   ├── 02-product-analyst.md
│   ├── 03-product-sheet-generator.md
│   ├── 04-campaign-strategist.md
│   ├── 05-casting-director.md
│   ├── 06-model-sheet-generator.md
│   ├── 07-screenwriter.md
│   ├── 08-storyboard-director.md
│   ├── 09-prompt-builder.md
│   └── 10-qa-director.md
├── templates/           ← Template เอกสารส่งมอบแต่ละขั้น
├── campaigns/           ← ผลงานจริงของแต่ละแคมเปญ (สร้างโฟลเดอร์ใหม่ต่อแคมเปญ)
└── docs/                ← เอกสารต้นฉบับ (Blueprint / System Prompt)
```

## Pipeline สรุปย่อ

| Step | ขั้นตอน | Agent | Gate |
|------|---------|-------|------|
| 1 | Product Intake — รับรูป/ลิงก์สินค้า | Orchestrator | — |
| 2 | Product Analysis — avatar, pain points, angle | Product Analyst | — |
| 3 | Product Sheet — hero shot, มุมต่าง ๆ, PNG ใส | Product Sheet Generator | — |
| 4 | Campaign Style — เลือกสไตล์โฆษณา | Campaign Strategist | ✋ user เลือก |
| 5 | Human Models? — ใช้คนหรือไม่ | Casting Director | ✋ user ตอบ |
| 6 | AI Casting — contact sheet ผู้สมัคร | Casting Director | ✋ user เลือก |
| 7 | Character Bible — สเปกตัวละครถาวร | Model Sheet Generator | ✋ user อนุมัติ |
| 8 | Story Strategy — PAS / AIDA / BAB / UGC ฯลฯ | Campaign Strategist | — |
| 9 | Screenplay — บทละเอียดระดับผู้กำกับ | Screenwriter | — |
| 10 | Storyboard — ฉากพร้อม Character/Asset IDs | Storyboard Director | — |
| 11 | Prompt Builder — Google Flow prompts รายฉาก | Prompt Builder | — |
| 12 | QA + Export — เช็ค continuity, ส่งมอบครบชุด | QA Director | — |

## Global Rules

- **ห้ามแต่งสรรพคุณสินค้าเอง** — ใช้เฉพาะข้อมูลที่ผู้ใช้ให้หรือยืนยันแล้ว
- **Character Bible อนุมัติแล้วห้ามเปลี่ยน** — ตัวละครต้องคงเดิมทุกฉาก
- **Continuity ต้องนิ่ง** — สินค้า, ตัวละคร, แสง, กล้อง สม่ำเสมอทุก asset
- **Optimize เพื่อ conversion** — hook ใน 3 วินาทีแรก, จบด้วย CTA เสมอ
