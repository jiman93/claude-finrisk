# Qualtrics Survey Spec — FinRisk User Study v2

**Study:** Enhancing Trust in AI-Generated Financial Risk Summaries through Human-in-the-Loop Feedback
**Ethics Protocol:** 1919 STa HSET 2026
**Approving Committee:** University of Hertfordshire HSET Ethics Committee with Delegated Authority
**Researcher:** Muhamad Zulhafiz Bin Zaini — bm24aaq@herts.ac.uk
**Supervisor:** Dr. Epaminondas Kapetanios — e.kapetanios@herts.ac.uk

---

## Overview: Two Surveys Needed

| Survey                                       | When used                          | Purpose                                                  |
| -------------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| **Survey 1: Registration & Screening** | Before session is booked           | Collect background, confirm eligibility, obtain consent  |
| **Survey 2: Post-Study Reflection**    | Immediately after the session ends | Capture mode preference, trust comparison, open feedback |

> The per-task questionnaire (completeness, accuracy, control ratings) is built directly into the FinRisk system and does **not** need to be in Qualtrics.

---

## Survey 1: Registration & Screening

**Qualtrics settings:**

- Survey name: `FinRisk Study — Registration Form`
- Anonymous link (no Qualtrics panel)
- Prevent ballot-box stuffing: Yes
- Progress bar: Yes
- Back button: No
- Response export: CSV with numeric values + labels

---

### Block 1 — Introduction & Participant Information Sheet

**Display type:** Descriptive text block (no question, no response)

---

**Text to display:**

```
Thank you for your interest in participating in our research study.

Study title: Enhancing Trust in AI-Generated Financial Risk Summaries through Human-in-the-Loop Feedback
Protocol Number: 1919 STa HSET 2026
Approved by: University of Hertfordshire HSET Ethics Committee with Delegated Authority

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PARTICIPANT INFORMATION SHEET

You are being invited to take part in a research study. Before you decide, please read the following carefully.

PURPOSE OF THE STUDY
This study investigates how human-in-the-loop (HITL) controls in an AI system affect your trust and perceived control when analysing corporate risk disclosures (SEC 10-K filings).

WHAT WILL YOU DO?
• Join a 30–40 minute online session via Microsoft Teams
• Complete a short walkthrough tutorial (no data collected)
• Complete two AI-assisted financial risk analysis tasks using the FinRisk prototype
• Rate each task after completion (2–3 minutes per task, built into the system)
• Answer a brief 5-minute written reflection after both tasks

WHAT DATA WILL BE COLLECTED?
• Screen and audio recording of the session (with your permission)
• Your in-system interactions (which document chunks you selected, edits made, time on task)
• Your post-task ratings and written reflections
• Background information (role, experience, familiarity with filings)

WILL YOUR DATA BE ANONYMOUS?
Yes. You will be assigned a participant ID (e.g., P03). Your name will not appear in any research output. Recordings will be stored securely and deleted after analysis.

IS PARTICIPATION VOLUNTARY?
Yes. You may withdraw at any time during the session. If you withdraw, all data collected up to that point will be deleted.

COMPENSATION
RM 150 will be provided regardless of full completion, as long as the tutorial and at least one task are completed.

CONTACT
Researcher: Muhamad Zulhafiz Bin Zaini — bm24aaq@herts.ac.uk | WhatsApp: +60198694573
Supervisor: Dr. Epaminondas Kapetanios — e.kapetanios@herts.ac.uk

If you have a concern about how this study is being conducted, contact the University of Hertfordshire Research Ethics office.
```

---

### Block 2 — Informed Consent

**Block title (internal):** Consent

**Q1 — Consent checkbox (multiple choice, multiple answer, required)**

Text: *Please read each statement and check the box to confirm your agreement. You must check all boxes to proceed.*

Options (each is a separate checkbox — participant must check ALL to advance):

1. I have read and understood the Participant Information Sheet above.
2. I understand that participation is voluntary and I can withdraw at any time without penalty.
3. I understand that my session will be screen- and audio-recorded and that recordings will be stored securely and deleted after analysis.
4. I agree that anonymised extracts from my responses may be used in research publications, presentations, or the researcher's dissertation.
5. I am aged 18 or over.
6. I give my consent to participate in this study.

**Display logic:** Add a custom validation — if fewer than 6 options are selected, show error message: *"Please check all boxes to confirm your consent before proceeding."* (Qualtrics force response + custom validation on this block.)

---

### Block 3 — Eligibility Screening

**Block title (internal):** Screening

**Q2 — Current role (multiple choice, single answer, required)**

*What best describes your current role or status?*

- Professional financial analyst (equity research, investment analysis, corporate finance)
- Risk consultant or advisory professional
- Investment manager or portfolio manager
- Compliance analyst (financial services)
- MSc Finance / MBA student
- CFA Level 2 or Level 3 candidate
- Final-year BSc Finance or Accounting undergraduate
- Other (please specify): [text entry field]

---

**Q3 — Years of experience (multiple choice, single answer, required)**

*How many years of experience do you have analysing corporate financial disclosures (e.g. 10-K filings, annual reports)?*

- Less than 1 year (academic coursework only)
- 1–2 years
- 3–5 years
- 6–10 years
- More than 10 years

---

**Q4 — 10-K / annual report familiarity (multiple choice, single answer, required)**

*How familiar are you with SEC 10-K filings or equivalent corporate annual reports?*

- Not familiar
- Somewhat familiar (occasional reading)
- Familiar (regular reading as part of coursework or work)
- Very familiar (weekly use)
- Daily use (core part of my role)

---

**Q5 — Prior AI tool use for financial analysis (multiple choice, single answer, required)**

*How often do you use AI tools (e.g. ChatGPT, Copilot, Bloomberg AI) for financial analysis tasks?*

- Never used AI tools for this purpose
- Tried once or twice
- Occasional use (monthly)
- Regular use (weekly)
- Daily use

---

**Screening logic (add after Q5):**

Add a branch:

- If Q2 = "Other (please specify)" AND Q3 = "Less than 1 year" → show disqualification block (see below)
- Otherwise → continue to Block 4

> **Note to Qualtrics builder:** The eligibility criteria are broad — professionals with 2+ years OR advanced learners (MSc/MBA/CFA/final-year undergrad). You do not need to hard-disqualify on these answers. The researcher will review registrations manually. Do NOT auto-disqualify based on screening answers — just collect them.

---

### Block 4 — Contact & Background

**Block title (internal):** Contact Details

**Q6 — Full name (text entry, required)**

*Your full name*

---

**Q7 — Email address (text entry, required, validate email format)**

*Email address we can use to send your session confirmation*

---

**Q8 — WhatsApp or phone number (text entry, optional)**

*WhatsApp or phone number (optional — useful for quick scheduling coordination)*

---

**Q9 — Preferred session window (multiple choice, multiple answer, optional)**

*Which time windows are generally available for you? (Select all that apply)*

- Weekday mornings (before 12:00 local time)
- Weekday afternoons (12:00–17:00 local time)
- Weekday evenings (after 17:00 local time)
- Weekends (any time)

---

**Q10 — Timezone (text entry, optional)**

*Your timezone or country (helps us schedule across regions)*

---

**Q11 — Additional notes (text entry, optional, character limit 300)**

*Anything else we should know? (e.g., scheduling constraints, questions about the study)*

---

### Block 5 — End of Survey

**Display type:** Descriptive text (end-of-survey message)

```
Thank you for registering!

We have received your registration for the FinRisk study (Protocol 1919 STa HSET 2026).

NEXT STEP — Book your session:
Please book a session time using the Calendly link below. Sessions are 30–40 minutes via Microsoft Teams.

[INSERT CALENDLY LINK HERE]

If you have any questions before your session, contact:
Zulhafiz — bm24aaq@herts.ac.uk | WhatsApp: +60198694573

We look forward to seeing you!
```

---

### Disqualification Block (branch from screening logic)

**Display type:** Descriptive text, shown only to ineligible respondents

```
Thank you for your interest.

Unfortunately, based on your background, you do not meet the eligibility criteria for this study. We are looking for:

• Finance professionals with 2+ years of relevant experience, OR
• Advanced learners (MSc Finance/MBA students, CFA Level 2/3 candidates, or final-year finance undergraduates)

If you believe this is an error, please contact us at bm24aaq@herts.ac.uk.

Thank you for your time.
```

---

---

## Survey 2: Post-Study Reflection

**When to send:** Researcher shares the link at the END of the session (via Teams chat), immediately before the closing interview.

**Qualtrics settings:**

- Survey name: `FinRisk Study — Post-Study Reflection`
- Anonymous link
- Progress bar: Yes
- Back button: No
- Estimated completion time: 5 minutes

---

### Block 1 — Introduction

**Display type:** Descriptive text

```
Post-Study Reflection
Protocol: 1919 STa HSET 2026

Thank you for completing both tasks. This short form takes about 5 minutes.

Your answers here form part of the primary data for this study, so please reflect honestly — there are no right or wrong answers.
```

---

### Block 2 — Participant ID

**Q1 — Participant ID (text entry, required)**

*Please enter your participant ID (e.g. P01, P02 — your researcher will have told you this at the start of the session)*

---

### Block 3 — Mode Preference

**Q2 — Mode preference (multiple choice, single answer, required)**

*Overall, which mode of AI-assisted analysis did you prefer?*

- Baseline (no interactive controls — you received the AI summary directly)
- HITL-Full (with chunk selector and summary editor)
- No clear preference

---

**Q3 — Preference strength (multiple choice, single answer, required)**

*How strong is that preference?*

- Strong preference
- Mild preference
- Slight lean (could go either way)

**Display logic:** Show Q3 only if Q2 ≠ "No clear preference"

---

**Q4 — Reason for preference (text entry, required, character limit 500)**

*In your own words, why did you prefer that mode? What made the difference?*

---

### Block 4 — Trust Comparison

**Q5 — Trust comparison (multiple choice, single answer, required)**

*Compared to the Baseline mode, how much did you trust the AI-generated summary in HITL-Full mode?*

- Trusted it significantly more in HITL-Full
- Trusted it somewhat more in HITL-Full
- About the same level of trust in both modes
- Trusted it somewhat less in HITL-Full (found it more confusing)
- Trusted it significantly less in HITL-Full

---

**Q6 — What drove your trust (text entry, required, character limit 500)**

*What specifically affected your level of trust in the summaries? (For example: seeing the source documents, ability to edit, citation references, something else)*

---

### Block 5 — Perceived Control

**Q7 — Control in Baseline (multiple choice, single answer, required)**

*During the Baseline task, how much control did you feel you had over the final summary?*

- 1 — No control at all
- 2 — Very little control
- 3 — Some control
- 4 — Good control
- 5 — Full control

---

**Q8 — Control in HITL-Full (multiple choice, single answer, required)**

*During the HITL-Full task, how much control did you feel you had over the final summary?*

- 1 — No control at all
- 2 — Very little control
- 3 — Some control
- 4 — Good control
- 5 — Full control

---

### Block 6 — Usability & Friction

**Q9 — Biggest friction point (text entry, optional, character limit 400)**

*Was there anything about the HITL-Full mode that you found slow, confusing, or unnecessary? (Leave blank if not applicable)*

---

**Q10 — Real-world use (multiple choice, single answer, required)**

*If this tool existed in your real workflow, which version would you use?*

- Baseline only (quick summary, no intervention)
- HITL-Full only (full controls every time)
- Depends on the task (use Baseline for routine reviews, HITL-Full for deep-dives)
- Neither — I would not use this tool in practice
- Other: [text entry]

---

**Q11 — Real-world use reasoning (text entry, optional, character limit 400)**

*Briefly explain your reasoning*

---

### Block 7 — Open Feedback

**Q12 — Strongest positive (text entry, optional, character limit 400)**

*What was the most useful or impressive aspect of the system?*

---

**Q13 — Strongest concern (text entry, optional, character limit 400)**

*What was your biggest concern or hesitation about using this system?*

---

**Q14 — Feature suggestions (text entry, optional, character limit 400)**

*Is there anything you would add or change about the HITL controls to make them more useful?*

---

**Q15 — Anything else (text entry, optional, character limit 500)**

*Any other observations, reactions, or thoughts you'd like to share?*

---

### Block 8 — End of Survey

**Display type:** Descriptive text

```
aThank you — your response has been recorded.

Please return to the Microsoft Teams call so we can complete the brief closing interview.

Researcher: Muhamad Zulhafiz (Zul)
Protocol: 1919 STa HSET 2026
```

---

---

## Notes for Qualtrics Builder

### Formatting conventions

- All Likert questions: use a vertical radio button layout, not a slider
- Required questions: mark with asterisk and enforce "force response"
- Character-limited text entries: enable character counter display
- Mobile optimisation: enable — some participants may be on tablets

### Survey 1 — Technical notes

- Set response export to include: response ID, start date, end date, all question fields, open-text fields
- Do not use Qualtrics Panels or recruit via Qualtrics — this is an external registration
- Add "thank you" email trigger if Qualtrics mailer is available (UH provisioned account may support this)

### Survey 2 — Technical notes

- Link is shared by the researcher verbally/in Teams chat at session end — do not embed in the FinRisk system
- Q1 (Participant ID) is manually entered — the researcher should confirm it matches the assigned ID before the interview begins
- All questions in Blocks 3–7 contribute to thematic analysis; open-text fields are primary data

### Ethics compliance

- Protocol number **1919 STa HSET 2026** must appear in:
  - The survey header/title block of both surveys
  - The PIS block in Survey 1
  - The end-of-survey confirmation in both surveys
- Consent must be obtained in Survey 1 before any background data is collected
- No identifiable data (name, email) should appear in the exported response CSV that is used for analysis — map by participant ID only

---

*Spec version: 1.0 | Date: 2026-04-25 | Study design: v2*
