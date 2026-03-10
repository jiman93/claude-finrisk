# User Study Guide: End-to-End Facilitator Handbook

**Study:** Enhancing Trust in AI-Generated Financial Risk Summaries through Human-in-the-Loop Feedback
**Researcher:** Muhamad Zulhafiz Bin Zaini (bm24aaq@herts.ac.uk)
**Supervisor:** Dr. Epaminondas Kapetanios (e.kapetanios@herts.ac.uk)
**Institution:** University of Hertfordshire, School of Physics, Engineering and Computer Science
**Ethics Protocol:** UH SPECS ECDA (approved)

---

## Quick Reference: Session Timeline

| #  | Stage                                        | Duration                                                                          | Running Total | Platform                 |
| -- | -------------------------------------------- | --------------------------------------------------------------------------------- | ------------- | ------------------------ |
| 1  | Recruitment & screening                      | Pre-session                                                                       | —            | Email / social media     |
| 2  | Scheduling & pre-session prep                | Pre-session                                                                       | —            | Email / Microsoft Teams  |
| 3  | Welcome & consent                            | 5 min                                                                             | 0:05          | Microsoft Teams          |
| 4  | Demographics survey                          | 5 min                                                                             | 0:10          | Google Forms / Qualtrics |
| 5  | Tutorial (WMT)                               | 10 min                                                                            | 0:20          | Study system             |
| 6  | Phase 1: Baseline task                       | 15 min                                                                            | 0:35          | Study system             |
| 7  | Post-task questionnaire #1                   | 2–3 min                                                                          | 0:38          | In-system                |
| 8  | Phase 2: HITL-R or HITL-G                    | 20 min                                                                            | 0:58          | Study system             |
| 9  | Post-task questionnaire #2                   | 2–3 min                                                                          | 1:01          | In-system                |
| 10 | Phase 3: HITL-Full                           | 20 min                                                                            | 1:21          | Study system             |
| 11 | Post-task questionnaire #3                   | 2–3 min                                                                          | 1:24          | In-system                |
| 12 | Post-session survey (SUS + NASA-TLX + Trust) | 12–15 min                                                                        | 1:39          | Google Forms / Qualtrics |
| 13 | Semi-structured interview (optional)         | 10–15 min                                                                        | 1:54          | Microsoft Teams          |
| 14 | Debrief & compensation                       | 2 min                                                                             | 1:56          | Microsoft Teams          |
|    | **Total**                              | **75–90 min** (without interview) / **85–105 min** (with interview) |               |                          |

---

## Phase 0: Recruitment & Screening

**Timeline:** 1–3 weeks before session
**Estimated effort:** 5–10 min per participant

### 0.1 Eligibility Criteria

Participants must meet **all** of the following:

- Aged 18 or over
- **Either** a professional financial analyst with ≥2 years relevant experience
- **Or** an advanced finance learner: MSc Finance / MBA student, CFA Level 2 or 3 candidate, or final-year undergraduate finance major with relevant training

### 0.2 Recruitment Channels

| Channel               | Target                       | Method                                                       |
| --------------------- | ---------------------------- | ------------------------------------------------------------ |
| Professional networks | Analysts (≥2 yr experience) | LinkedIn posts, personal contacts, CFA society mailing lists |
| University cohorts    | MSc/MBA students             | Course announcements, student email lists                    |
| Finance communities   | Mixed                        | Reddit r/financialcareers, Discord servers, X/Twitter        |

### 0.3 Screening Process

1. **Initial outreach** — share recruitment poster / message explaining:

   - Study purpose (evaluating AI tools for financial risk analysis)
   - Time commitment (75–90 minutes, online via Microsoft Teams)
   - Compensation (RM150 / ~£27 / ~$34 USD)
   - Eligibility requirements
2. **Screening questions** (via email or short form):

   - Current role/status
   - Years of experience with corporate financial disclosures
   - Familiarity with SEC 10-K or equivalent filings
   - Availability for a 90-minute online session
3. **Eligibility confirmation** — respond within 48 hours:

   - If eligible: send scheduling link and pre-session instructions
   - If ineligible: thank them politely, explain criteria not met

### 0.4 Sample Size Target

|                     | Minimum | Target | Maximum |
| ------------------- | ------- | ------ | ------- |
| **Total**     | 12      | 16–24 | 24      |
| **Per group** | 6       | 8–12  | 12      |

### 0.5 Group Assignment

Assign participants alternately to **Group A** or **Group B** as they are confirmed:

| Group       | Phase 1  | Phase 2                  | Phase 3          |
| ----------- | -------- | ------------------------ | ---------------- |
| **A** | Baseline | HITL-R (chunk selection) | HITL-Full (both) |
| **B** | Baseline | HITL-G (summary editing) | HITL-Full (both) |

Record assignment in the participant tracking sheet before the session.

---

## Phase 1: Pre-Session Setup

**Timeline:** 1–3 days before session
**Estimated effort:** 10–15 min per participant

### 1.1 Send Confirmation Email

Send **at least 48 hours** before the session. Include:

- [ ] Date, time, and timezone
- [ ] Microsoft Teams meeting link
- [ ] Participant ID (e.g., P01) — **do not use real names in study data**
- [ ] Brief study description (1–2 sentences)
- [ ] Technical requirements:
  - Stable internet connection
  - Desktop/laptop with modern browser (Chrome or Edge recommended)
  - Quiet environment for audio recording
  - Screen sharing enabled in Teams
- [ ] Estimated duration: 75–90 minutes
- [ ] Compensation details: RM150 paid after session
- [ ] Contact information for questions

### 1.2 Facilitator Preparation Checklist

Complete **before each session**:

- [ ] Confirm participant group assignment (A or B)
- [ ] Confirm ticker assignment for all 3 phases (see ticker table below)
- [ ] Verify system is running and accessible via study URL
- [ ] Pre-load the correct session configuration (participant ID, group, tickers)
- [ ] Open demographics survey link (Google Forms / Qualtrics)
- [ ] Open post-session survey link (Google Forms / Qualtrics)
- [ ] Prepare interview question guide (if participant consented to interview)
- [ ] Test screen recording in Microsoft Teams
- [ ] Test audio recording
- [ ] Have consent form ready to share on screen

### 1.3 Ticker Assignment Table

Each participant is assigned 3 tickers across quality tiers:

| Quality Tier                           | Tickers                            | Retrieval Score   | Use For                    |
| -------------------------------------- | ---------------------------------- | ----------------- | -------------------------- |
| **Tier 1: Excellent (90%+)**     | WMT (100%), AMZN (93%), AAPL (88%) | High confidence   | Tutorial (WMT), main tasks |
| **Tier 2: Good (80–89%)**       | MSFT (80%)                         | Medium confidence | Main tasks                 |
| **Tier 3: Acceptable (75–79%)** | TSLA (75%), PFE (75%), XOM (78%)   | Lower confidence  | Quality comparison         |

**Assignment principles:**

- Phase 1 always uses a Tier 1 or Tier 2 ticker (anchor with quality)
- Each participant gets tickers from different sectors
- Tutorial always uses WMT (highest quality, not used in main tasks)

**Example assignments:**

```
P01 (Group A): AMZN → MSFT → PFE   (Tier 1 → 2 → 3)
P02 (Group B): AAPL → MSFT → TSLA  (Tier 1 → 2 → 3)
P03 (Group A): AMZN → AAPL → XOM   (Tier 1 → 1 → 3)
P04 (Group B): AAPL → AMZN → PFE   (Tier 1 → 1 → 3)
```

---

## Phase 2: Session Start — Welcome & Consent (5 min)

**Platform:** Microsoft Teams (video call)
**Recording:** NOT yet recording

### 2.1 Welcome Script (~1 min)

> "Hello [first name], thank you for joining today. My name is Zulhafiz, and I'm a Master's student at the University of Hertfordshire. I'm researching how human feedback can improve trust in AI-generated financial risk analysis.
>
> Today's session will take about 75 to 90 minutes. You'll be using an AI system that analyzes 10-K filings and generates risk summaries. You'll try different interaction modes and share your impressions afterward. There are no right or wrong answers — I'm interested in your honest experience."

### 2.2 Study Overview (~2 min)

Explain the session structure at a high level:

> "Here's what we'll do today:
>
> 1. First, I'll walk you through the consent process and a short demographics survey.
> 2. Then there's a tutorial to get you comfortable with the system.
> 3. You'll complete three analysis tasks, each with a different company and interaction mode.
> 4. After each task, you'll answer a few quick questions.
> 5. At the end, there's a final survey, and optionally a short interview.
>
> You can take a break at any time. If you want to stop, just let me know — no explanation needed."

### 2.3 Consent Process (~2 min)

1. **Share screen** — display the consent form (or share the link)
2. Read or summarize the key consent points:

> "Before we start, I need your informed consent. Let me share the key points:
>
> - **Voluntary participation:** You're free to withdraw at any time without giving a reason.
> - **Recording:** I will record the screen and audio for research purposes. Your face video is NOT routinely recorded.
> - **Anonymity:** Your data will only be linked to a participant ID (yours is **[ID]**), not your name.
> - **Data storage:** All data is stored on encrypted University of Hertfordshire OneDrive. Survey data is deleted from the platform right after export.
> - **Data retention:** Anonymized data kept for 5 years (April 2026 – April 2031), then permanently deleted. The name-to-ID list is deleted within 3 months of thesis completion.
> - **Compensation:** You will receive RM150 regardless of whether you complete the full session.
> - **Contact:** If you have concerns, you can reach me at bm24aaq@herts.ac.uk or my supervisor Dr. Kapetanios at e.kapetanios@herts.ac.uk."

3. Participant reads and confirms consent statements:

   - "I confirm that I have read the study information and had the opportunity to ask questions."
   - "I understand that my participation is voluntary, and I am free to withdraw at any time."
   - "I am 18 or over."
4. **Record verbal consent** or have participant click "YES" on the consent form.
5. **Optional consent for future data use:**

   > "With your permission, anonymized data may also be used for future academic publications or teaching materials. You can opt out of this without affecting your participation today. Would you consent to future academic use of your anonymized data?"
   >

### 2.4 Start Recording

> "I'm now going to start recording the session. This includes screen recording and audio. Your camera feed will not be recorded unless you specifically agree to it. Is that okay?"

- [ ] Start Microsoft Teams recording (screen + audio)
- [ ] Confirm recording indicator is visible

---

## Phase 3: Demographics Survey (5 min)

**Platform:** Google Forms / Qualtrics (external link)
**Data collected:** Participant ID only (no name)

### 3.1 Administer Demographics Survey

> "Before we begin the tutorial, please complete this short demographics survey. It should take about 5 minutes. Please enter your participant ID as **[ID]** — do not enter your name."

Share the survey link in the Teams chat.

### 3.2 Survey Questions

| # | Question                                                      | Type                                                                                             | Required |
| - | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| 1 | Current role/status                                           | Single choice: Professional analyst, MSc/MBA student, CFA Level 2/3, Final-year undergrad, Other | Yes      |
| 2 | Years of experience analyzing corporate financial disclosures | Single choice: <1, 1–2, 3–5, 6–10, >10 years                                                  | Yes      |
| 3 | Familiarity with SEC 10-K or equivalent filings               | Single choice: Not familiar → Expert (5-point)                                                  | Yes      |
| 4 | Prior use of AI tools for financial analysis                  | Single choice: Never used → Use daily (5-point)                                                 | Yes      |
| 5 | Age range                                                     | Single choice: 18–24, 25–34, 35–44, 45–54, 55+, Prefer not to say                            | No       |
| 6 | Gender                                                        | Single choice: Male, Female, Non-binary, Self-describe, Prefer not to say                        | No       |
| 7 | Industry focus                                                | Multi-select: Technology, Healthcare, Finance, Retail, Energy, Manufacturing, Other              | No       |

### 3.3 While Participant Completes Survey

- Verify the study system is loaded with the correct session configuration
- Confirm the participant's ticker assignment and group are correct
- Prepare to share the study system URL

---

## Phase 4: Tutorial (10 min)

**Platform:** Study system (shared via browser link)
**Ticker:** WMT (Walmart) — Tier 1, 100% retrieval quality
**Mode:** Simplified HITL-Full (all features shown)
**Query:** "Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business."
**Data collected:** None (practice only)

### 4.1 Share System Access (~1 min)

> "Now I'll share the link to our AI risk analysis system. Please open it in your browser."

Share the study URL in Teams chat. Confirm the participant can see the system interface.

### 4.2 Interface Walkthrough (~2 min)

Walk through the main interface elements:

> "Let me give you a quick tour of the interface:
>
> - **Query box:** This is where you'll enter (or see) the analysis query.
> - **Document panel:** Shows the source SEC 10-K filing sections.
> - **Summary panel:** Displays the AI-generated risk summary.
> - **Citations:** Each statement in the summary links back to the source document."

### 4.3 Demo Query Submission (~1 min)

> "Let's try a practice query. The query is already pre-filled: 'Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business.' Go ahead and submit it."

Wait for the system to process the query.

### 4.4 Demo Chunk Selector — HITL-R (~3 min)

> "The system has retrieved several document sections. This is the **chunk selector** — it lets you control which source material the AI uses.
>
> - Each chunk shows a preview of the content and which section of the 10-K it came from.
> - You can **check or uncheck** chunks to include or exclude them.
> - Try expanding a chunk to read the full content.
> - When you're satisfied with your selection, click Continue.
>
> This feature won't always be available — it depends on the mode. Let's practice using it now."

Let the participant interact with the chunk selector. Answer any questions.

### 4.5 Demo Summary Editor — HITL-G (~3 min)

> "Now the AI has generated a risk summary based on your selected chunks. This is the **summary editor** — it lets you directly edit the AI's output.
>
> - You can **add, modify, or remove** text.
> - Changes are tracked so we can see what was modified.
> - You can revert changes if needed.
>
> Try making a small edit — perhaps adding a clarification or removing something you think is irrelevant. This feature also won't always be available."

Let the participant practice editing. Answer any questions.

### 4.6 Q&A (~1 min)

> "That covers the main features. Do you have any questions about how the system works before we begin the actual tasks?"

Address all questions. Confirm readiness to proceed.

> "Great. From this point on, everything counts as study data. I'll give you instructions before each task. Remember, there are no right or wrong answers — just interact with the system naturally."

---

## Phase 5: Task Phase 1 — Baseline (15 min)

**Mode:** Baseline (no HITL checkpoints)
**Ticker:** Assigned Tier 1–2 ticker (per participant assignment)
**Query:** Pre-defined standardized query for the assigned ticker

### 5.1 Task Introduction (~1 min)

> "For this first task, you'll be working with **[TICKER]** ([Company Name]). The AI system will process the query and generate a risk summary automatically. In this mode, you'll review the final output — there are no editing or selection tools.
>
> The query has been pre-filled. Please submit it when you're ready."

### 5.2 Task Flow

| Step | Activity                                                                                | Est. Time |
| ---- | --------------------------------------------------------------------------------------- | --------- |
| 1    | Participant submits the pre-filled query                                                | 1 min     |
| 2    | AI retrieves document chunks and generates summary (automatic, no user intervention)    | 1–2 min  |
| 3    | Participant reviews the AI-generated summary, reads source citations, evaluates quality | 8 min     |
| 4    | Post-task questionnaire appears in-system (see Phase 5.3)                               | 2–3 min  |
| 5    | Transition to next phase                                                                | 1 min     |

### 5.3 Post-Task Questionnaire #1 (~2–3 min)

The in-system questionnaire appears automatically after the participant finishes reviewing. It includes:

| # | Question                                                        | Scale                                     | Required |
| - | --------------------------------------------------------------- | ----------------------------------------- | -------- |
| 1 | How complete was this summary?                                  | 5-point: Very incomplete → Very complete | Yes      |
| 2 | How accurate was this summary based on the retrieved documents? | 5-point: Very inaccurate → Very accurate | Yes      |
| 3 | Were the source citations helpful for verifying the summary?    | Yes / Partly / No                         | Yes      |
| 4 | Any concerns or observations about this task?                   | Open text (200 char max)                  | No       |

> "Please take a moment to answer these questions based on what you just experienced. There are no right or wrong answers."

### 5.4 Transition

> "Thank you. Let's move on to the second task. This time, the system will work a bit differently — you'll have [an additional tool / more control] available."

---

## Phase 6: Task Phase 2 — HITL-R or HITL-G (20 min)

**Mode:**

- Group A → **HITL-R** (chunk selector only — user selects which document chunks feed into generation)
- Group B → **HITL-G** (summary editor only — user edits the AI-generated summary)

**Ticker:** Assigned Tier 1–3 ticker (per participant assignment)
**Query:** Pre-defined standardized query for the assigned ticker

### 6.1 Task Introduction (~1 min)

**For Group A (HITL-R):**

> "For this task, you'll be working with **[TICKER]** ([Company Name]). This time, after the system retrieves document sections, you'll have the **chunk selector** — the same tool you practiced in the tutorial. You can choose which sections the AI uses to write its summary. Take your time reviewing and selecting."

**For Group B (HITL-G):**

> "For this task, you'll be working with **[TICKER]** ([Company Name]). This time, after the AI generates its summary, you'll have the **summary editor** — the same tool you practiced in the tutorial. You can edit, add, or remove content from the summary. Take your time reviewing and editing."

### 6.2 Task Flow

**Group A (HITL-R):**

| Step | Activity                                                                                 | Est. Time |
| ---- | ---------------------------------------------------------------------------------------- | --------- |
| 1    | Participant submits query                                                                | 1 min     |
| 2    | AI retrieves document chunks                                                             | 1–2 min  |
| 3    | **CHECKPOINT: Chunk selector** — participant reviews and selects/deselects chunks | 7 min     |
| 4    | AI generates summary from selected chunks                                                | 1–2 min  |
| 5    | Participant reviews final summary                                                        | 4 min     |
| 6    | Post-task questionnaire                                                                  | 2–3 min  |
| 7    | Transition                                                                               | 1 min     |

**Group B (HITL-G):**

| Step | Activity                                                                      | Est. Time |
| ---- | ----------------------------------------------------------------------------- | --------- |
| 1    | Participant submits query                                                     | 1 min     |
| 2    | AI retrieves chunks and generates summary (automatic)                         | 1–2 min  |
| 3    | **CHECKPOINT: Summary editor** — participant reviews and edits summary | 7 min     |
| 4    | Participant reviews final edited summary                                      | 4 min     |
| 5    | Post-task questionnaire                                                       | 2–3 min  |
| 6    | Transition                                                                    | 1 min     |

### 6.3 Post-Task Questionnaire #2 (~2–3 min)

Same as questionnaire #1, **plus additional HITL-specific questions:**

| # | Question                                                                                  | Scale                                | Required |
| - | ----------------------------------------------------------------------------------------- | ------------------------------------ | -------- |
| 1 | How complete was this summary?                                                            | 5-point                              | Yes      |
| 2 | How accurate was this summary based on the retrieved documents?                           | 5-point                              | Yes      |
| 3 | Were the source citations helpful for verifying the summary?                              | Yes / Partly / No                    | Yes      |
| 4 | How much control did you have over the final summary?                                     | 5-point: No control → Full control  | Yes      |
| 5 | How helpful was the**[chunk selector / summary editor]** for improving the summary? | 5-point: Not helpful → Very helpful | Yes      |
| 6 | Any concerns or observations about this task?                                             | Open text (200 char max)             | No       |

### 6.4 Transition

> "Thank you. For the final task, you'll have access to **both** tools — the chunk selector and the summary editor."

---

## Phase 7: Task Phase 3 — HITL-Full (20 min)

**Mode:** HITL-Full (both chunk selector AND summary editor)
**Ticker:** Assigned Tier 1–3 ticker (per participant assignment)
**Query:** Pre-defined standardized query for the assigned ticker
**Both groups (A and B) follow the same flow.**

### 7.1 Task Introduction (~1 min)

> "For this final task, you'll be working with **[TICKER]** ([Company Name]). This time, you'll have **both** the chunk selector and the summary editor available — full control over the entire process. First you'll select the source material, then you'll be able to edit the generated summary."

### 7.2 Task Flow

| Step | Activity                                                                       | Est. Time |
| ---- | ------------------------------------------------------------------------------ | --------- |
| 1    | Participant submits query                                                      | 1 min     |
| 2    | AI retrieves document chunks                                                   | 1–2 min  |
| 3    | **CHECKPOINT 1: Chunk selector** — participant selects/deselects chunks | 6 min     |
| 4    | AI generates summary from selected chunks                                      | 1–2 min  |
| 5    | **CHECKPOINT 2: Summary editor** — participant edits summary            | 6 min     |
| 6    | Participant reviews final summary                                              | 2 min     |
| 7    | Post-task questionnaire                                                        | 2–3 min  |

### 7.3 Post-Task Questionnaire #3 (~2–3 min)

Same format as questionnaire #2 (HITL version with all 6 questions). The "feature" question references **"the chunk selector and summary editor"**.

---

## Phase 8: Post-Session Survey (12–15 min)

**Platform:** Google Forms / Qualtrics (external link)
**Timing:** Immediately after all 3 task phases

> "You've completed all three tasks — thank you! Now I'd like you to fill out a final survey about your overall experience. It has three parts and should take about 12 to 15 minutes."

Share the post-session survey link in the Teams chat.

### 8.1 Part A: System Usability Scale — SUS (~3 min)

Standard 10-item SUS questionnaire (5-point Likert: Strongly disagree → Strongly agree):

| #  | Statement                                                                                  |
| -- | ------------------------------------------------------------------------------------------ |
| 1  | I think that I would like to use this system frequently.                                   |
| 2  | I found the system unnecessarily complex.                                                  |
| 3  | I thought the system was easy to use.                                                      |
| 4  | I think that I would need the support of a technical person to be able to use this system. |
| 5  | I found the various functions in this system were well integrated.                         |
| 6  | I thought there was too much inconsistency in this system.                                 |
| 7  | I would imagine that most people would learn to use this system very quickly.              |
| 8  | I found the system very cumbersome to use.                                                 |
| 9  | I felt very confident using the system.                                                    |
| 10 | I needed to learn a lot of things before I could get going with this system.               |

### 8.2 Part B: NASA Task Load Index — NASA-TLX (~3 min)

6 dimensions rated on a 0–100 slider scale:

| Dimension       | Prompt                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| Mental Demand   | How mentally demanding were the tasks?                                 |
| Physical Demand | How physically demanding were the tasks?                               |
| Temporal Demand | How hurried or rushed was the pace of the tasks?                       |
| Performance     | How successful were you in accomplishing what you were asked to do?    |
| Effort          | How hard did you have to work to accomplish your level of performance? |
| Frustration     | How insecure, discouraged, irritated, stressed, and annoyed were you?  |

### 8.3 Part C: Trust Questionnaire (~6 min)

8-item trust questionnaire (7-point Likert: Strongly disagree → Strongly agree):

| # | Statement                                                               |
| - | ----------------------------------------------------------------------- |
| 1 | I trust the AI system to provide accurate risk summaries.               |
| 2 | The AI system is reliable.                                              |
| 3 | I feel confident using the AI system's outputs in my professional work. |
| 4 | The AI system provides sufficient explanations for its outputs.         |
| 5 | I can depend on the AI system to function properly.                     |
| 6 | The AI system's citations help me verify its outputs.                   |
| 7 | I would recommend this AI system to colleagues.                         |
| 8 | Overall, I trust this AI system for financial analysis.                 |

### 8.4 Part D: Retrospective Feature Comparison (optional, ~3 min)

| # | Question                                                                              |
| - | ------------------------------------------------------------------------------------- |
| 1 | How much control did you have over the summary in Phase 1 (Baseline)? (5-point)       |
| 2 | How much control did you have over the summary in Phase 2? (5-point)                  |
| 3 | How helpful was the [chunk selector / summary editor] in Phase 2? (5-point)           |
| 4 | How much control did you have over the summary in Phase 3 (HITL-Full)? (5-point)      |
| 5 | How helpful were the chunk selector and summary editor combined in Phase 3? (5-point) |
| 6 | Which mode did you prefer overall? (Baseline / Phase 2 / HITL-Full)                   |
| 7 | Why did you prefer this mode? (Open text)                                             |

---

## Phase 9: Semi-Structured Interview (10–15 min, optional)

**Platform:** Microsoft Teams (audio recorded)
**Timing:** After post-session survey
**Participation:** Voluntary — participant can decline

### 9.1 Pre-Interview Checklist

- [ ] Confirm participant is comfortable to continue
- [ ] Remind participant of audio recording and right to pause or withdraw
- [ ] Confirm participant is in a private space
- [ ] Note participant group and phase path:
  - Group A: Baseline → HITL-R → HITL-Full
  - Group B: Baseline → HITL-G → HITL-Full

### 9.2 Interview Introduction (~1 min)

> "If you're willing, I'd love to ask a few open-ended questions about your experience. This should take about 10 to 15 minutes. It's completely optional — you can skip it or stop at any time. Everything you say will remain confidential and anonymized. Is that okay?"

### 9.3 Core Interview Questions (~8–12 min)

Ask in order, but allow natural conversation to flow. Use follow-up probes as needed.

**Q1: Mode Preference**

> "Which phase or mode did you prefer overall, and why?"

*Probes:* Was there a mode that felt most natural? Most useful? Most frustrating?

**Q2: Trust Trajectory**

> "How did your trust in the system change across the three phases — from Baseline, to Phase 2, to the final phase with both tools?"

*Probes:* Was there a specific moment when your trust increased or decreased? What triggered that change?

**Q3: Chunk Selector Value (if applicable)**

> "How useful was the chunk selector — being able to control which document sections the AI used?"

*Probes:* Did it help you feel more confident in the output? Were there chunks that surprised you (included but shouldn't be, or missing)?

**Q4: Summary Editor Value (if applicable)**

> "How useful was the summary editor — being able to directly modify the AI's output?"

*Probes:* Did you find errors to correct? Did editing change how much you trusted the result? Was the editing experience smooth?

**Q5: Improvement Suggestions**

> "What improvements would you suggest for this system to be useful in your actual work?"

*Probes:* What's missing? What would make you more likely to adopt it? What would make you less likely?

### 9.4 Closing (~1 min)

> "Thank you for sharing your thoughts. Is there anything else you'd like to add that we haven't covered?"

Note any final comments.

---

## Phase 10: Debrief & Compensation (2 min)

### 10.1 Debrief Script

> "Thank you so much for participating today. Your feedback is incredibly valuable for this research.
>
> Just to summarize what happens next:
>
> - Your data will be stored securely and anonymized using only your participant ID.
> - If you'd like to withdraw your data at any point, just email me at bm24aaq@herts.ac.uk before the thesis is submitted, referencing your participant ID.
> - The findings will be part of my Master's thesis. With your consent, anonymized data may appear in future publications."

### 10.2 Compensation

> "You'll receive RM150 compensation for your time today. Let me confirm the best way to send this to you."

- [ ] Confirm payment method (bank transfer, e-wallet, etc.)
- [ ] Record payment details in compensation log
- [ ] Process payment within 7 working days
- [ ] Note: compensation is provided regardless of study completion

### 10.3 Stop Recording

> "I'm now stopping the recording. Thank you again for your time."

- [ ] Stop Microsoft Teams recording
- [ ] Confirm recording saved

### 10.4 Final Contact

> "If you have any questions or concerns after today, don't hesitate to reach out. My email is bm24aaq@herts.ac.uk. Have a great day!"

---

## Post-Session: Facilitator Tasks

**Estimated time:** 15–20 min per participant

### Immediately After Session

- [ ] Export and verify screen recording from Teams
- [ ] Export audio recording
- [ ] Verify demographics survey response (correct participant ID)
- [ ] Verify post-session survey response (correct participant ID)
- [ ] Verify in-system questionnaire data captured for all 3 phases
- [ ] Spot-check interaction logs (chunk selections, edits, timestamps)

### Within 24 Hours

- [ ] Download survey data from Google Forms / Qualtrics
- [ ] Upload all data to UH OneDrive (encrypted, password-protected)
- [ ] Delete survey responses from the survey platform
- [ ] Update participant tracking sheet (completion status, group, tickers used)
- [ ] Process compensation payment
- [ ] Transcribe interview audio (if applicable)

### Data Security Reminders

| Data Type                   | Storage                             | Retention                                                |
| --------------------------- | ----------------------------------- | -------------------------------------------------------- |
| Survey responses            | UH OneDrive (encrypted)             | 5 years (Apr 2026 – Apr 2031)                           |
| Screen/audio recordings     | UH OneDrive (encrypted)             | Deleted after transcription and analysis                 |
| Interview transcripts       | UH OneDrive (encrypted, anonymized) | 5 years                                                  |
| Participant ID ↔ Name list | UH OneDrive (encrypted)             | Deleted within 3 months of thesis completion (~Jun 2026) |
| Interaction logs            | UH OneDrive (encrypted)             | 5 years                                                  |

---

## Appendix A: Standardized Queries Per Ticker

| Ticker         | Company    | Standardized Query                                                                                                                               |
| -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **WMT**  | Walmart    | "Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business."                                               |
| **AMZN** | Amazon     | *[Define before study — e.g., "What are the key regulatory and competitive risks affecting Amazon's cloud and e-commerce operations?"]*       |
| **AAPL** | Apple      | *[Define before study — e.g., "Analyze the technology and geopolitical risks that could impact Apple's hardware supply chain."]*              |
| **MSFT** | Microsoft  | *[Define before study — e.g., "What are the key technology and cybersecurity risks that could impact Microsoft's cloud business?"]*           |
| **TSLA** | Tesla      | *[Define before study — e.g., "Identify the production, regulatory, and market risks facing Tesla's automotive business."]*                   |
| **PFE**  | Pfizer     | *[Define before study — e.g., "What are the clinical, regulatory, and patent expiration risks affecting Pfizer's pharmaceutical portfolio?"]* |
| **XOM**  | ExxonMobil | *[Define before study — e.g., "Analyze the environmental, regulatory, and commodity price risks facing ExxonMobil's energy operations."]*     |

> **Note:** Finalize all queries before the first session. The same query must be used for all participants assigned to a given ticker.

---

## Appendix B: Participant Tracking Template

| PID | Name (delete post-study) | Group | Phase 1 Ticker | Phase 2 Ticker | Phase 3 Ticker | Session Date | Demographics ✓ | Post-Survey ✓ | Interview ✓ | Compensation ✓ |
| --- | ------------------------ | ----- | -------------- | -------------- | -------------- | ------------ | --------------- | -------------- | ------------ | --------------- |
| P01 | —                       | A     | AMZN           | MSFT           | PFE            | YYYY-MM-DD   | ☐              | ☐             | ☐           | ☐              |
| P02 | —                       | B     | AAPL           | MSFT           | TSLA           | YYYY-MM-DD   | ☐              | ☐             | ☐           | ☐              |
| ... |                          |       |                |                |                |              |                 |                |              |                 |

---

## Appendix C: Troubleshooting

| Issue                                                  | Resolution                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Participant can't access system URL                    | Share direct link in Teams chat; try different browser; check firewall                |
| System loads slowly or times out                       | Refresh page; check server status; offer a 2-min break while restarting               |
| Survey link doesn't work                               | Have backup PDF version of survey; manually record responses                          |
| Audio/screen recording fails                           | Restart Teams recording; if persistent, take written notes instead                    |
| Participant wants to withdraw mid-session              | Thank them, stop recording, confirm data deletion, still provide compensation         |
| Participant finishes a phase much faster than expected | That's fine — move on naturally, don't pad time                                      |
| Participant seems fatigued                             | Offer a short break ("Would you like to take a 2-minute break before the next task?") |
| Technical error during HITL checkpoint                 | Note the error, skip to next phase if unrecoverable, document in session notes        |

---

## Appendix D: Ethics Quick Reference

| Item                       | Detail                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Ethics committee** | UH Health, Science, Engineering and Technology ECDA                                                      |
| **Protocol number**  | *[To be assigned]*                                                                                     |
| **Researcher**       | Muhamad Zulhafiz Bin Zaini (bm24aaq@herts.ac.uk)                                                         |
| **Supervisor**       | Dr. Epaminondas Kapetanios (e.kapetanios@herts.ac.uk)                                                    |
| **Withdrawal**       | Any time, no reason required, data deleted on request                                                    |
| **Compensation**     | RM150 (~£27 / ~$34 USD), paid regardless of completion                                                  |
| **Recording**        | Screen + audio only; face video NOT routinely recorded                                                   |
| **Anonymization**    | Participant IDs only (P01, P02, ...); no names in data                                                   |
| **Complaints**       | Secretary and Registrar, University of Hertfordshire, College Lane, Hatfield, Hertfordshire AL10 9AB, UK |