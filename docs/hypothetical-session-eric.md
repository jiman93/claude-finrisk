# Hypothetical Session: Eric (P03)

**Participant:** Eric
**ID:** P03
**Background:** MSc Finance student at UoB, 1 year internship at a mid-size asset manager, familiar with SEC filings but has not used AI tools for financial analysis before.
**Assignment:** Task 1 = MSFT (Baseline), Task 2 = AMZN (HITL-Full)
**Date:** Tuesday, 15 April 2026, 2:00 PM
**Platform:** Microsoft Teams (screen shared, session recorded with permission)

---

## Stage 1: Introduction & Consent (3 min)

**2:00 PM** - Eric joins the Teams call. Researcher welcomes him.

> **Researcher:** "Thanks for joining, Eric. This session will take about 30 to 40 minutes. You'll be using a system called FinRisk that generates financial risk summaries from real SEC 10-K filings. You'll complete two tasks using different modes of the system, and I'll ask you some questions at the end. There are no right or wrong answers - I'm interested in your honest experience."

Eric reads and signs the digital consent form. He confirms he's okay with screen recording.

> **Researcher:** "I'll start the recording now. Feel free to think aloud as you go - any reactions or thoughts are useful."

**2:03 PM** - Recording starts.

---

## Stage 2: Tutorial with WMT (5 min)

**2:03 PM** - Researcher shares the FinRisk URL. Eric enters his participant ID (P03) and sees the phase overview screen.

> **Researcher:** "Before we start the real tasks, let's do a quick walkthrough so you're comfortable with the interface."

The system loads the tutorial phase with WMT in HITL-Full mode.

**2:04 PM** - The pre-defined query appears in the chat stream:

> *"Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business."*

Eric clicks to submit. A loading message appears: "Retrieving relevant sections..."

**2:04:30 PM** - Retrieval completes. The chat stream shows:
- **Traversal path:** PART I > Item 1A: Risk Factors > Competition and E-commerce > Supply Chain and Distribution
- **Retrieved chunks:** 5 chunks displayed as collapsible cards

> **Researcher:** "These are sections the system pulled from Walmart's 10-K filing. In some modes you'll be able to select which ones to keep. Let me show you."

The chunk selector checkpoint appears. Eric sees 5 chunks with checkboxes, all pre-selected:

1. Item 1A > Competition from E-Commerce (1,102 chars) - checked
2. Item 1A > Supply Chain Disruptions (987 chars) - checked
3. Item 1A > Consumer Spending Patterns (756 chars) - checked
4. Item 1A > Labour Market and Staffing (634 chars) - checked
5. Item 7 > Inventory Management (445 chars) - checked

> **Researcher:** "You can read each chunk, expand it, and uncheck anything you think isn't relevant. Try unchecking one."

Eric expands chunk 4 (Labour Market and Staffing), skims it.

> **Eric:** "This one seems more about HR than supply chain risks."

He unchecks it. He also unchecks chunk 5 (Inventory Management).

> **Researcher:** "Good. Now click Continue to generate the summary."

**2:06 PM** - Eric clicks Continue. Loading message: "Generating summary..."

**2:06:30 PM** - The AI-generated summary appears in the chat stream, formatted with markdown and citations like [Item 1A: Competition, Page 24].

> **Researcher:** "In some modes you'll also be able to edit this summary. Let me show you the editor."

The summary editor checkpoint appears. Eric sees the summary in an editable text area.

> **Researcher:** "You can change anything - fix wording, remove a sentence, add something. You can also flag text you think might be wrong. Try making a small edit."

Eric reads through the summary. He changes "Walmart faces intense competition from Amazon and other e-commerce platforms" to "Walmart faces intense competition from Amazon, Shopify merchants, and other e-commerce platforms."

> **Researcher:** "Great. In the actual tasks, just do whatever feels natural. Don't feel pressured to edit if you think it's fine. Ready to start?"

> **Eric:** "Yeah, makes sense."

**2:08 PM** - Tutorial complete. Researcher advances to the main tasks.

---

## Stage 3: Task 1 - MSFT Baseline (10 min)

**2:08 PM** - The system shows Phase 1: Baseline mode with MSFT.

A phase_start message appears in the chat:
> *Phase 1 of 2 - Baseline mode - MSFT*
> *In this mode, the system will retrieve and generate automatically. You will review the output.*

The pre-defined query appears:
> *"What are the key technology and cybersecurity risks that could impact Microsoft's cloud business?"*

**2:08:30 PM** - Eric clicks to submit. Loading: "Retrieving relevant sections..."

**2:09 PM** - Retrieval completes. The chat shows:
- **Traversal path:** PART I > Item 1A: Risk Factors > Cybersecurity and Data Privacy > Cloud Infrastructure Risks
- **Retrieved chunks:** 6 chunks displayed as collapsed cards (read-only, no selector)

1. Item 1A > Cybersecurity Threats (1,340 chars)
2. Item 1A > Cloud Service Disruptions (1,122 chars)
3. Item 1A > Data Privacy Regulation (998 chars)
4. Item 1A > Competition in Cloud (876 chars)
5. Item 1A > AI and Emerging Tech Risks (723 chars)
6. Item 1A > Government Contracts and Compliance (654 chars)

Eric expands and reads chunks 1 and 2. He skims the rest.

> **Eric (thinking aloud):** "Okay so it pulled cybersecurity stuff and cloud disruptions... chunk 6 about government contracts doesn't seem super relevant but I can't do anything about it."

**2:10 PM** - Loading: "Generating summary..."

**2:10:30 PM** - The AI-generated summary appears. ~300 words covering cybersecurity threats, cloud reliability, regulatory pressure, and competitive landscape. Citations reference [Item 1A: Cybersecurity Threats, Page 18] and similar.

Eric reads the summary carefully.

> **Eric (thinking aloud):** "It mentions Azure outages and data breaches... the citations are there which is good. But it included that government contracts bit which I don't think is really about cloud business risk. I can't change it though."

**2:14 PM** - The post-generation questionnaire appears:

| Question | Eric's Response |
|---|---|
| How complete was this summary? | 4 - Complete |
| How accurate was this summary? | 3 - Acceptable |
| Were citations helpful for verifying? | Yes |
| How much control did you have over the final summary? | 1 - No control |
| Open feedback | "Summary included government contract risks which felt off-topic. Couldn't remove it." |

*Feature usefulness question not shown - Baseline mode.*

**2:16 PM** - Eric submits the questionnaire. A submitted_checkpoint card appears in the chat. The phase_advance button appears.

> **Researcher:** "Take a moment if you need. When you're ready, move to the next task."

**2:17 PM** - Eric clicks to advance.

---

## Stage 4: Task 2 - AMZN HITL-Full (10 min)

**2:17 PM** - The system shows Phase 2: HITL-Full mode with AMZN.

A phase_start message appears:
> *Phase 2 of 2 - HITL-Full mode - AMZN*
> *In this mode, you can select which retrieved sections to use AND edit the generated summary.*

The pre-defined query appears:
> *"What are Amazon's key operational and competitive risks in e-commerce and cloud services?"*

**2:17:30 PM** - Eric submits. Loading: "Retrieving relevant sections..."

**2:18 PM** - Retrieval completes. The chat shows:
- **Traversal path:** PART I > Item 1A: Risk Factors > Competition and Growth > Operations and Fulfilment
- **Retrieved chunks:** 7 chunks

The chunk selector checkpoint appears:

1. Item 1A > E-Commerce Competition (1,245 chars) - checked
2. Item 1A > AWS Market Competition (1,087 chars) - checked
3. Item 1A > Fulfilment and Logistics Risks (934 chars) - checked
4. Item 1A > International Operations (812 chars) - checked
5. Item 1A > Regulatory and Antitrust (756 chars) - checked
6. Item 1A > Content and Media Segment (623 chars) - checked
7. Item 7 > Revenue Concentration by Segment (445 chars) - checked

Eric starts reading through the chunks, expanding each one.

> **Eric (thinking aloud):** "E-commerce competition, yes. AWS competition, definitely. Fulfilment risks, yes that's operational. International operations... okay that's relevant. Regulatory... yeah. Content and media - that's about Prime Video, not really e-commerce or cloud. And this last one is just revenue numbers."

**2:20 PM** - Eric unchecks chunk 6 (Content and Media Segment) and chunk 7 (Revenue Concentration). He keeps 5 chunks selected.

He clicks Continue. Loading: "Generating summary from 5 selected sections..."

**2:20:30 PM** - The AI-generated summary appears. ~280 words focused tightly on e-commerce competition, AWS market position, fulfilment/logistics risks, international exposure, and regulatory threats. Citations reference the selected chunks.

The summary editor checkpoint appears. Eric reads the summary in the editable text area.

> **Eric (thinking aloud):** "This is more focused than the last one. It's actually about what I'd want to know... Let me check the regulatory part."

He reads the regulatory paragraph:
> *"Amazon faces growing antitrust scrutiny across multiple jurisdictions, with the European Commission and US Federal Trade Commission investigating marketplace practices [Item 1A: Regulatory and Antitrust, Page 31]."*

> **Eric:** "That's fine. But it says 'multiple jurisdictions' without being specific. Let me add something."

**2:23 PM** - Eric edits the sentence to:
> *"Amazon faces growing antitrust scrutiny in the US, EU, and India, with the European Commission and US Federal Trade Commission investigating marketplace practices [Item 1A: Regulatory and Antitrust, Page 31]."*

He also notices the summary doesn't mention supply chain dependency on third-party sellers. He adds a sentence at the end of the fulfilment paragraph:
> *"The company's reliance on third-party sellers for over 60% of unit sales also creates quality control and counterfeiting risks."*

> **Eric (thinking aloud):** "That's not cited because I added it myself, but I know that from the filing."

He clicks Finalize.

**2:25 PM** - The post-generation questionnaire appears:

| Question | Eric's Response |
|---|---|
| How complete was this summary? | 5 - Very complete |
| How accurate was this summary? | 4 - Accurate |
| Were citations helpful for verifying? | Yes |
| How much control did you have over the final summary? | 5 - Full control |
| How helpful was the chunk selector and summary editor? | 4 - Helpful |
| Open feedback | "Being able to remove irrelevant chunks made the summary more focused. Editing let me add context I knew was missing." |

**2:27 PM** - Eric submits. The session_complete marker appears.

---

## Stage 5: Post-Study Reflection (5 min)

**2:27 PM** - Researcher pulls up the post-study reflection questions.

**Mode preference:**
> **Researcher:** "You just used two different modes. Which did you prefer?"
>
> **Eric:** "The second one, definitely. Being able to pick the chunks and edit the summary."

**Trust comparison:**
> **Researcher:** "Which summary did you trust more?"
>
> **Eric:** "The Amazon one. Not because Amazon is easier - I think it's because I could see what went in and I could fix things. The Microsoft one had that government contracts bit that shouldn't have been there, and I just had to live with it."

**Written reflection:**
Eric types: "HITL-Full mode gave me more confidence in the output because I could remove irrelevant sections before generation and correct the summary after. In Baseline mode I noticed issues but couldn't act on them, which was frustrating."

---

## Stage 6: Closing Interview (8 min)

**2:32 PM** - Semi-structured interview begins.

> **Researcher:** "You mentioned the government contracts chunk in the Microsoft task. Can you say more about how that affected your trust?"
>
> **Eric:** "It wasn't wrong exactly, but it wasn't what I asked about. Cloud business risk isn't really about government contracts. It made me wonder what else the system might have included that wasn't quite right. In the Amazon task I could just uncheck stuff like that, so I didn't have that worry."

> **Researcher:** "How did the chunk selector compare to the summary editor in terms of usefulness?"
>
> **Eric:** "The chunk selector felt more impactful because it changed what went into the summary in the first place. The editor was nice for polishing but by that point the summary was already pretty good because I'd curated the input. If I had to pick one I'd want the chunk selector."

> **Researcher:** "Would you use a system like this in a real work context?"
>
> **Eric:** "With the editing controls, yeah. For a first pass on a risk summary it would save a lot of time. Without the controls... I'd probably just read the filing myself. I wouldn't trust a black box summary for anything I'd put my name on."

> **Researcher:** "Anything you'd change about the system?"
>
> **Eric:** "Maybe show me why the system chose certain chunks. Like a relevance score or something. And it would be good to search for additional sections if I thought something was missing, not just work with what it gave me."

**2:40 PM** - Interview wraps up.

---

## Stage 7: Debrief (2 min)

> **Researcher:** "That's everything. Thanks so much for your time, Eric. Your feedback is really valuable. I'll process the compensation within the next few days. If you have any questions later, feel free to reach out."

> **Eric:** "No problem, good luck with the dissertation."

**2:42 PM** - Recording stops. Eric leaves the call.

**Total session time: 42 minutes.**

---

## Data Collected from Eric's Session

### System-Captured (Automatic)

| Field | Task 1 (MSFT Baseline) | Task 2 (AMZN HITL-Full) |
|---|---|---|
| Mode | baseline | hitl_full |
| Ticker | MSFT | AMZN |
| Time on task | 9 min 30 sec | 10 min 0 sec |
| Chunks retrieved | 6 | 7 |
| Chunks selected | N/A (auto) | 5 of 7 |
| Chunks rejected | N/A | 2 (Content/Media, Revenue) |
| Generated summary | 302 words | 278 words |
| Summary edited | No | Yes |
| Characters edited | 0 | +87 chars (2 edits) |
| Flagged spans | N/A | 0 |
| Traversal path | PART I > Item 1A > Cybersecurity > Cloud | PART I > Item 1A > Competition > Operations |

### Questionnaire Responses

| Measure | Task 1 (Baseline) | Task 2 (HITL-Full) | Delta |
|---|---|---|---|
| Completeness | 4 | 5 | +1 |
| Accuracy | 3 | 4 | +1 |
| Citations helpful | Yes | Yes | Same |
| Perceived control | 1 | 5 | +4 |
| Feature usefulness | N/A | 4 | - |

### Qualitative Data

| Source | Key Themes |
|---|---|
| Think-aloud (Task 1) | Noticed irrelevant chunk, frustrated by lack of control |
| Think-aloud (Task 2) | Active curation, more confident in output quality |
| Open feedback (Task 1) | Off-topic content, no ability to correct |
| Open feedback (Task 2) | Chunk removal improved focus, editing filled gaps |
| Post-study reflection | HITL-Full preferred, trust linked to ability to act on issues |
| Interview | Chunk selector more impactful than editor; would not trust black-box output professionally; wants transparency into selection rationale |

### Themes for Thematic Analysis

From Eric's session, initial codes might include:

- **Trust through agency** - trust increased when Eric could act on problems he noticed
- **Frustration of passive observation** - seeing issues in Baseline but being unable to fix them reduced trust
- **Input curation > output editing** - chunk selector perceived as more impactful than summary editor
- **Professional accountability** - "I wouldn't put my name on" a black-box summary
- **Relevance filtering** - removing off-topic chunks improved perceived summary quality
- **Transparency desire** - wants to understand why chunks were selected, not just which ones
