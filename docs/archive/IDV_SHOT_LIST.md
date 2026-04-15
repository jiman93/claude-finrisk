# IDV Shot List — FinRisk HITL Prototype

**Target duration:** 8–10 minutes (HARD MAX: 10 minutes — 50% over = marks capped at half)
**Format:** OBS Studio — screen recording + webcam (top corner, ~1/8 screen) + microphone
**Output:** MP4 H.264, 1080p minimum
**Filename:** `SRN_Surname_IDV.mp4`

---

## Spec Rules (from assignment brief)

- **Webcam required** — face visible, placed on top of screen, 1/8 screen size, must not obscure content
- **NO slides** — all evidence must be live screen activity (app, code, terminal, documents)
- **Do NOT repeat the IPR** — assessors read both; the video focuses on demonstrating, not narrating the report
- **Speech should be brief and in points** — don't read from documents
- **Max 10 minutes** — going to 15 minutes caps your mark at 50%

---

## OBS Setup

1. Download OBS Studio from https://obsproject.com/
2. **Sources to add:**
   - Display Capture or Window Capture (browser)
   - Video Capture Device (webcam) — resize to ~1/8 of screen, position top-right corner
   - Audio Input Capture (microphone)
3. **Settings:**
   - Output > Recording: MP4, encoder H.264, quality High
   - Video: 1920x1080 (or your native resolution)
4. **Test:** Record 10 seconds, play back — check audio levels, webcam position, screen clarity
5. **Tip:** Close notifications, hide taskbar, maximise browser window

---

## Pre-Recording Checklist

### App
- [ ] Backend running: `uvicorn app.main:app --port 8000`
- [ ] Frontend running: `npm run dev` → http://localhost:5173
- [ ] `.env` has `RETRIEVAL_MODE=tree` and valid `OPENAI_API_KEY`
- [ ] Fresh database or known clean state
- [ ] Assignment defaults generated (all P01-P16 visible)
- [ ] One completed session in chat history (for sidebar demo)
- [ ] Browser full-screen, bookmarks bar hidden

### Supporting windows (Alt+Tab between these)
- [ ] VS Code with `tree_service.py` open
- [ ] VS Code with `AAPL_tree.json` open (scrolled to Item 1A)
- [ ] VS Code with `chroma_service.py` open (scrolled to retry code)
- [ ] Terminal with a tree build output (pre-captured or ready to run)
- [ ] `chunk-quality-audit.md` open in VS Code or browser (summary table visible)

### Hardware
- [ ] Webcam on, positioned top of screen
- [ ] Microphone tested
- [ ] Room quiet, door closed
- [ ] OBS recording in MP4 format

---

## Segment 1: Introduction (0:00 – 0:25)

### Show
App landing screen (participant ID entry), idle.

### Say
> This is FinRisk — a research prototype that studies how human oversight affects trust in AI-generated financial risk summaries from SEC 10-K filings. I'll demonstrate what was built, the key features, and the challenges I solved.

### Do
- Show the landing screen for a few seconds
- No clicking yet

---

## Segment 2: Data Pipeline (0:25 – 1:30)

### Show
Terminal → VS Code (tree JSON) → quality audit table.

### Say
> The system processes real 10-K filings from SEC EDGAR. I download the filings, index them through the PageIndex API to get the document structure, then run my tree index builder.
>
> *(switch to VS Code — tree JSON)*
>
> This transforms the raw document tree into a canonical hierarchy — Part, Item, sub-section — matching the SEC-mandated structure. Here's AAPL's tree — you can see Part I, Item 1A Risk Factors, then individual risk categories as leaves.
>
> The key transformation is splitting. Apple's "Business Risks" was originally a single 30,000-character block. After my pipeline, it's nine focused chunks of about 3,000 characters each.
>
> *(switch to quality audit)*
>
> I've built indexes for ten tickers — over 1,200 leaf nodes — and run automated quality audits. Zero heading-only stubs after pruning, zero duplicates after disambiguation, under 1% truncated content.

### Do
1. Show terminal briefly (tree build output)
2. Switch to AAPL_tree.json — scroll to show hierarchy structure
3. Show chunk-quality-audit.md summary table — hover over key numbers

---

## Segment 3: Participant Flow — Baseline (1:30 – 3:15)

### Show
Browser — full study flow.

### Say
> Let me show the participant experience. I'll enter as P01.
>
> *(type P01, click Load)*
>
> This is the onboarding screen — three phases, each with a different company and HITL mode. The pipeline preview shows the steps for each phase.
>
> *(start session)*
>
> Phase one is Baseline — the AI works fully automatically. The query fires, the system retrieves sections via tree traversal.
>
> *(point to traversal path)*
>
> This traversal path shows exactly how the system navigated the document — Part I, then Item 1A, then specific sub-sections. This is the explainability trace.
>
> *(point to summary)*
>
> Here's the generated summary with inline citations. In Baseline mode the participant just reads — no controls.
>
> The questionnaire then captures trust, accuracy, completeness, and control ratings.

### Do
1. Type P01, Load Participant
2. Pause on onboarding — hover over phase cards and pipeline preview
3. Start session — let query and retrieval run
4. Point to traversal path with mouse cursor
5. Scroll through summary slowly — point to a citation
6. Show questionnaire appearing in the tail zone

---

## Segment 4: HITL-R — Chunk Selection (3:15 – 4:45)

### Show
Browser — advance to HITL-R phase.

### Say
> In HITL-R mode, the participant controls which retrieved sections the AI uses.
>
> *(show chunk selector)*
>
> After retrieval, this selector appears. Each chunk has a title, page reference, and preview. I can expand any chunk to read the full content.
>
> *(expand one)*
>
> I'll deselect these two — they're not relevant. The counter updates.
>
> *(deselect, submit)*
>
> Now the AI generates using only my selected chunks. This is human control at the retrieval stage.

### Do
1. Advance to HITL-R phase (or show pre-loaded)
2. Scroll through chunk selector slowly
3. Expand one chunk — let content show for 3 seconds
4. Deselect 1-2 chunks — point to counter
5. Submit, show generation with selected chunks

---

## Segment 5: HITL-G — Summary Editing (4:45 – 6:00)

### Show
Browser — HITL-G mode.

### Say
> HITL-G mode gives control at the generation stage. The AI generates automatically, then the participant reviews and edits.
>
> *(show summary with edit option)*
>
> They can accept with "Looks Good" or click "Edit Summary".
>
> *(click Edit)*
>
> Now they can modify the text. The system tracks characters edited. When they submit, both versions are preserved — original stays in the stream, the edit is accessible separately.
>
> *(make edit, submit)*
>
> This is human control at the output stage.

### Do
1. Show summary with Looks Good / Edit buttons
2. Click Edit Summary — show text area
3. Make a visible edit (add or change a sentence, slowly)
4. Submit — show result in stream

---

## Segment 6: Questionnaire, Follow-ups, Chat History (6:00 – 7:00)

### Show
Browser — continue in app.

### Say
> After every phase, regardless of mode, the participant fills a questionnaire — trust, accuracy, completeness, control, feature usefulness, and open feedback. These are the primary outcome measures.
>
> *(fill quickly)*
>
> They can also ask follow-up questions — either conversational, which uses the LLM without new retrieval, or document search, which triggers the full retrieval pipeline.
>
> *(send a follow-up)*
>
> The sidebar shows chat history. Past sessions are restorable as read-only transcripts.

### Do
1. Fill questionnaire fields (not too fast — let viewer see each field)
2. Submit — show it collapsing
3. Type a follow-up, show response
4. Click a past session in sidebar briefly

---

## Segment 7: Admin Tools (7:00 – 7:50)

### Show
Browser — switch between admin pages.

### Say
> Three admin tools. The Study Control Panel shows all sixteen participants and their assignments — I can override any configuration.
>
> *(switch to Study Monitor)*
>
> The Study Monitor shows live completion rates and progress. I can drill into a session to see all tasks, and into a task to see the full detail — retrieved nodes, selected chunks, summary, edits, questionnaire responses.
>
> *(drill in)*
>
> This lets me monitor data quality during sessions without interfering with participants.

### Do
1. Show Study Setup — scroll participant grid
2. Switch to Study Monitor — show overview stats
3. Click into a session, then a task detail
4. Click back

---

## Segment 8: Challenges (7:50 – 9:30)

### Show
VS Code (code), app (UI), quality table.

### Say
> Three challenges worth highlighting.
>
> **First — retrieval evolution.** I started with ChromaDB vector search, which ignores document structure and returned boilerplate alongside relevant content. I moved to PageIndex trees, but raw trees had 30,000-character nodes and empty stubs. The final approach — LLM-guided tree traversal — navigates the SEC hierarchy level by level. Here's the navigation code.
>
> *(show tree_service.py briefly)*
>
> **Second — ChromaDB index corruption.** The vector store failed intermittently on startup with stale reader errors. Background processes invalidated file handles. I implemented auto-retry with client reset — here's the code.
>
> *(show chroma_service.py retry pattern)*
>
> **Third — retrieval quality variance.** Accuracy ranged from 100% for Walmart to 75% for Tesla. Rather than hiding this, I built it into the study design as quality tiers — one of my research questions asks whether HITL controls compensate for lower quality.
>
> *(show quality tier table)*

### Do
1. Show `tree_service.py` — the traverse function and LLM prompt (scroll slowly)
2. Show `chroma_service.py` — the try/except/reset block
3. Show quality audit table — point to the tier groupings

---

## Segment 9: Wrap-up (9:30 – 9:50)

### Show
Return to app landing screen or onboarding.

### Say
> To summarise — a full-stack research prototype with three retrieval modes, four HITL conditions, a counterbalanced study protocol, and admin monitoring. Ten tickers processed, 1,200+ nodes quality-audited. The system is ready for the user study. Thank you.

### Do
- Return to landing screen
- Hold for a few seconds, stop recording

---

## Post-Recording Checklist

- [ ] Webcam visible throughout (top corner, ~1/8 screen)
- [ ] Face is lit and recognisable (not silhouetted)
- [ ] Audio is clear — no background noise, consistent volume
- [ ] Every feature is visible long enough to read (no speed-clicking)
- [ ] Challenges segment shows code/tables on screen, not just narration
- [ ] **No slides anywhere** — all evidence is live screen activity
- [ ] Content does not repeat the IPR — video demonstrates, report explains
- [ ] Trim dead air (loading > 5s — speed up or cut)
- [ ] **Total duration ≤ 10:00** (check before exporting!)
- [ ] Export as MP4, H.264, 1080p
- [ ] Filename: `SRN_Surname_IDV.mp4`

---

## Timing Summary

| Segment | Start | Duration | Cumulative |
|---------|-------|----------|------------|
| 1. Introduction | 0:00 | 0:25 | 0:25 |
| 2. Data Pipeline | 0:25 | 1:05 | 1:30 |
| 3. Baseline Mode | 1:30 | 1:45 | 3:15 |
| 4. HITL-R (Chunk Selection) | 3:15 | 1:30 | 4:45 |
| 5. HITL-G (Summary Editing) | 4:45 | 1:15 | 6:00 |
| 6. Questionnaire, Follow-ups, History | 6:00 | 1:00 | 7:00 |
| 7. Admin Tools | 7:00 | 0:50 | 7:50 |
| 8. Challenges | 7:50 | 1:40 | 9:30 |
| 9. Wrap-up | 9:30 | 0:20 | 9:50 |

**Buffer: 10 seconds** — total ≤ 10:00
