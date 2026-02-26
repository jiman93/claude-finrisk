# Video Recording Guide

## Video 1: Recruitment Video (30s, face-to-camera)

**Purpose**: Get finance professionals and students to sign up for the study.
**Where it goes**: LinkedIn, WhatsApp, Notion advert page, email signatures.
**Format**: 1080p, 16:9 (landscape). Also export a 1:1 square crop for social.

---

### Script (word-for-word, ~30 seconds)

> What happens when financial analysts can actually push back on AI?
>
> I'm Zul — I'm finishing my Masters in AI at University of Hertfordshire, and I've built a system that generates financial risk summaries from 10-K filings.
>
> I need experienced eyes to test it. If you work in equity research, investment analysis, or corporate finance — or you're a graduate finance student — I'd love 90 minutes of your time.
>
> RM 150 compensation, fully anonymous, online or in KL. Link in the description.

---

### Shot List

| # | Time | Visual | Audio | Notes |
|---|------|--------|-------|-------|
| 1 | 0:00–0:04 | Face, looking at camera | "What happens when financial analysts can actually push back on AI?" | Slight pause after. This is the hook — deliver it with energy. |
| 2 | 0:04–0:12 | Face, same angle | "I'm Zul — I'm finishing my Masters..." | Natural, conversational. Don't rush. |
| 3 | 0:12–0:15 | **B-roll insert**: quick UI flash (2-3s) | "...that generates financial risk summaries from 10-K filings." | Zoomed-in crop of the chat stream, slightly blurred. Just enough to show the dark UI exists. |
| 4 | 0:15–0:17 | Back to face | "I need experienced eyes to test it." | |
| 5 | 0:17–0:24 | Face | "If you work in equity research..." | |
| 6 | 0:24–0:30 | Face + text overlay fades in | "RM 150 compensation, fully anonymous..." | Overlay shows: RM 150 · 90 min · Anonymous · Feb–Mar 2026 |

---

### Recording Setup

**Camera**
- Phone front camera on a tripod or propped up at eye level
- Landscape orientation (16:9)
- 1080p minimum

**Framing**
- Head and shoulders, centered
- Small amount of headroom
- Clean background (plain wall, bookshelf, or office — nothing distracting)

**Lighting**
- Face a window (natural light) or use a desk lamp placed behind the camera pointing at your face
- Avoid overhead-only lighting (creates shadows under eyes)
- No backlight (don't sit with a window behind you)

**Audio**
- Quiet room, no fan/AC hum if possible
- Phone's built-in mic is fine if it's within arm's reach
- If you have earbuds with a mic (AirPods, etc.), clip them just out of frame — cleaner audio than the phone mic
- Do a 5-second test recording and play it back before the real take

**Clothing**
- Solid colours work best on camera (no busy patterns)
- Collared shirt or smart-casual — you're talking to finance people

---

### B-roll Insert (Shot 3)

Record this separately as a screen recording:

1. Open the app in the browser
2. Navigate to an active chat session that has a generated summary visible
3. Slowly scroll the chat stream for 5 seconds
4. In editing, crop to a tight section (hide sidebar and right panel), apply a subtle gaussian blur (radius 3-5px), and use only 2-3 seconds of it

**What to show**: The dark UI, blue accents, text flowing. The feeling of a polished tool.
**What to hide**: Sidebar nav, mode badges, chunk selector, any readable text.

---

### Text Overlay (Shot 6)

Fade in a simple overlay in the bottom third:

```
RM 150  ·  90 min  ·  Fully anonymous
Online or Kuala Lumpur  ·  Feb–Mar 2026
```

Font: Clean sans-serif (Inter, Helvetica, or your system default). White text, semi-transparent dark background bar.

---

### Recording Process

**Step 1 — Rehearse (5 min)**
- Read the script aloud 3 times
- Time yourself — aim for 25–30 seconds of speech
- Mark where you naturally pause (after the hook, after "test it")

**Step 2 — Record the B-roll (5 min)**
- Screen record the app with OBS or Windows Game Bar (Win+G)
- Scroll slowly through a chat session
- You'll crop and blur this in editing later

**Step 3 — Record face-to-camera (15 min)**
- Do 5–8 full takes
- Don't stop mid-take — just restart from the top if you stumble
- Vary your energy: some takes more conversational, some more direct
- Pick the best one in editing

**Step 4 — Edit (20 min)**
- Use CapCut (free, mobile or desktop) or DaVinci Resolve (free, desktop)
- Timeline:
  1. Best face take (full)
  2. Cut in B-roll at 0:12–0:15 (replace face video, keep your voiceover)
  3. Add text overlay at 0:24
  4. Add a 0.5s fade-in at start and fade-out at end
- No background music for the primary version (cleaner for LinkedIn)
- Optional: export a second version with subtle ambient music for WhatsApp/social

**Step 5 — Export**
- 1080p MP4, H.264
- Export twice: 16:9 (LinkedIn, YouTube) and 1:1 square crop (Instagram, WhatsApp status)

---

### Checklist

- [ ] Script printed or on a screen just below camera (so eye line stays near lens)
- [ ] Phone charged, storage free
- [ ] Room quiet, door closed
- [ ] Good lighting on face
- [ ] App running with demo data for B-roll
- [ ] 5-second audio test done
- [ ] Record 5+ takes
- [ ] Edit: face + B-roll insert + text overlay
- [ ] Export 16:9 and 1:1 versions
- [ ] Upload to YouTube (unlisted) for the in-app embed later

---

## Video 2: In-App Walkthrough (60–90s, screen recording)

**Purpose**: Show participants how the tool works before their session starts.
**Where it goes**: Embedded in the app onboarding screen via `VIDEO_CONFIG` in `StudyChatGate.tsx`.
**When to record**: Once the app is fully stable, closer to session dates.

*Detailed guide to be written when ready to record.*
