# Hypothetical Results — User Study v2 (Synthetic, Illustrative Only)

**Purpose:** Illustrate the expected shape of v2 study findings to support thesis discussion drafting and analysis-pipeline planning before real data collection completes.
**Status:** SYNTHETIC. No real participant data. Numbers and quotes are plausible but invented.
**Linked design:** [USER_STUDY_DESIGN_v2.md](USER_STUDY_DESIGN_v2.md)
**Sample:** N = 8 (P01–P08), all completed both tasks
**Date assumed:** Sessions run mid-April to early May 2026

---

## 1. Participant Pool

| ID  | Background                                | Years exp. | 10-K familiarity | Prior AI tool use | Order        | Tickers       |
| --- | ----------------------------------------- | ---------- | ---------------- | ----------------- | ------------ | ------------- |
| P01 | Senior equity research analyst (UK)       | 8          | Daily            | Cautious user     | BL → Full    | AMZN → AAPL   |
| P02 | Risk consultant, Big-4 advisory           | 4          | Weekly           | Comfortable       | Full → BL    | AAPL → MSFT   |
| P03 | MSc Finance student, prior buy-side intern | 1          | Occasional       | Limited           | BL → Full    | MSFT → AMZN   |
| P04 | Junior credit analyst, CFA L3 candidate   | 2          | Weekly           | Comfortable       | Full → BL    | AMZN → AAPL   |
| P05 | MBA student, ex-management consulting     | 3 (non-IB) | Occasional       | Heavy daily user  | BL → Full    | AAPL → MSFT   |
| P06 | Investment manager, mid-cap equities      | 12         | Daily            | Sceptical         | Full → BL    | MSFT → AMZN   |
| P07 | Final-year BSc Finance, dissertation on ESG | 0 (academic) | Coursework only | Comfortable       | BL → Full    | AMZN → AAPL   |
| P08 | Compliance analyst at retail bank         | 3          | Weekly           | Limited           | Full → BL    | AAPL → MSFT   |

**Pool composition:** 5 working professionals, 3 advanced learners. Mixed prior AI exposure.

---

## 2. Quantitative Results (Descriptive)

### 2.1 Per-task Likert ratings (1 = lowest, 5 = highest)

| ID  | Task   | Mode      | Completeness | Accuracy | Citations  | Control | Feature use |
| --- | ------ | --------- | ------------ | -------- | ---------- | ------- | ----------- |
| P01 | T1     | Baseline  | 3            | 4        | Partly     | 1       | —           |
| P01 | T2     | HITL-Full | 4            | 4        | Yes        | 5       | 4           |
| P02 | T1     | HITL-Full | 4            | 4        | Yes        | 4       | 4           |
| P02 | T2     | Baseline  | 4            | 4        | Partly     | 2       | —           |
| P03 | T1     | Baseline  | 3            | 3        | No         | 1       | —           |
| P03 | T2     | HITL-Full | 4            | 4        | Yes        | 4       | 5           |
| P04 | T1     | HITL-Full | 5            | 5        | Yes        | 5       | 5           |
| P04 | T2     | Baseline  | 4            | 4        | Partly     | 2       | —           |
| P05 | T1     | Baseline  | 3            | 3        | No         | 2       | —           |
| P05 | T2     | HITL-Full | 3            | 4        | Partly     | 3       | 3           |
| P06 | T1     | HITL-Full | 4            | 4        | Yes        | 4       | 4           |
| P06 | T2     | Baseline  | 3            | 4        | Partly     | 1       | —           |
| P07 | T1     | Baseline  | 4            | 3        | Partly     | 1       | —           |
| P07 | T2     | HITL-Full | 4            | 4        | Yes        | 4       | 4           |
| P08 | T1     | HITL-Full | 5            | 5        | Yes        | 5       | 5           |
| P08 | T2     | Baseline  | 3            | 4        | No         | 2       | —           |

### 2.2 Mode comparison (median, mean, n=8 per mode)

| Measure              | Baseline             | HITL-Full           | Direction |
| -------------------- | -------------------- | ------------------- | --------- |
| Completeness         | Median 3, Mean 3.4   | Median 4, Mean 4.1  | ↑ HITL    |
| Accuracy             | Median 4, Mean 3.6   | Median 4, Mean 4.3  | ↑ HITL    |
| Perceived Control    | Median 1.5, Mean 1.5 | Median 4, Mean 4.3  | ↑↑ HITL   |
| Citation: Yes        | 0 / 8                | 6 / 8               | ↑↑ HITL   |
| Citation: Partly     | 5 / 8                | 1 / 8               | —         |
| Citation: No         | 3 / 8                | 1 / 8               | —         |
| Feature usefulness   | n/a                  | Median 4, Mean 4.25 | —         |

**Headline pattern:** Perceived Control shows the largest within-subject shift (≈ +2.8 on a 5-point scale). Quality measures (completeness, accuracy) shift modestly upward. Citation helpfulness flips from majority "Partly/No" to majority "Yes."

### 2.3 Time on task (minutes, from system telemetry)

| Mode      | Median | Mean | Range |
| --------- | ------ | ---- | ----- |
| Baseline  | 4.5    | 4.8  | 3–7   |
| HITL-Full | 9.0    | 9.4  | 7–13  |

HITL-Full takes ≈ 2× the time. Edit interactions account for the largest share of the difference.

---

## 3. Qualitative Results (Synthetic Quotes)

### 3.1 Mode preference (post-study, direct comparison)

| ID  | Preferred mode | Strength      | Reasoning summary                                                                  |
| --- | -------------- | ------------- | ---------------------------------------------------------------------------------- |
| P01 | HITL-Full      | Strong        | "I'd never sign off on the baseline output."                                       |
| P02 | HITL-Full      | Mild          | Sees value but worried about scaling to a full portfolio.                          |
| P03 | HITL-Full      | Strong        | Surfacing the chunks helped him learn what mattered in the filing.                 |
| P04 | HITL-Full      | Strong        | "The editor turned it into a real working document."                               |
| P05 | Baseline       | Mild          | Found HITL-Full "fiddly" given his daily workflow speed.                           |
| P06 | HITL-Full      | Mild          | Trusts it more, but not enough to use unsupervised.                                |
| P07 | HITL-Full      | Strong        | Educational value as a learner.                                                    |
| P08 | HITL-Full      | Strong        | Liked the explicit accountability; matches her compliance mindset.                 |

**Tally:** 6 strong-HITL, 1 mild-HITL, 1 mild-Baseline. No participant strongly preferred Baseline.

### 3.2 Themes from interviews + open feedback

**Theme 1 — Control as the dominant trust driver.**
Across professionals and learners, the chunk selector was repeatedly cited as the moment where trust shifted. Several participants said the summary felt "the same" between modes but they trusted it more after seeing the underlying evidence.

> *"I think the summaries were probably similar in quality, but in baseline I was just expected to believe it. With the HITL one I'd actually checked the source — that's a huge difference for sign-off."* — P01 (senior analyst)

> *"It's not that I don't trust the AI, it's that I don't know what it's hiding from me. The chunks fixed that."* — P06

**Theme 2 — Cognitive cost vs trust trade-off.**
Most participants accepted the time cost, but framed it as situational. Several said HITL-Full would be unrealistic for high-volume work.

> *"For a single deep-dive, sure, this is great. For going through 40 portfolio companies a quarter, no chance."* — P02

> *"I would happily take 10 minutes per filing if the alternative is I have to spot-check the AI by re-reading the original anyway."* — P04

**Theme 3 — Hidden-error anxiety in Baseline.**
Even when participants gave Baseline reasonable accuracy ratings, they often qualified them with uncertainty about what the model might have omitted.

> *"I'd give it a 4 for accuracy on what's there. But I have no way of knowing what it dropped from the filing — could be the most important thing."* — P05

**Theme 4 — Educational value of chunk selector (advanced learners).**
P03 and P07 both volunteered that the chunk selector helped them understand the structure of the filing itself, not just verify the AI's output.

> *"Honestly the chunks were teaching me what to look for in a 10-K. I'd never read one before this."* — P07

**Theme 5 — Edit ergonomics: positive, with reservations.**
Participants generally found the summary editor easy to use. Two requested richer features (inline source pinning, accept/reject suggestions) but did not consider these blockers.

> *"It's good, but I want a 'mark this sentence as unsupported' option rather than deleting it."* — P08

**Theme 6 — Calibration of expectations.**
Several participants said the experience updated their priors on AI-generated summaries — both upward (surprise at quality) and downward (specific factual errors caught).

> *"I caught one cited number that wasn't in the actual chunk it pointed to. Honestly that one moment changed how I think about using these tools — I want the chunks every time now."* — P04

### 3.3 Open feedback — representative comments

**On Baseline tasks:**
- "Felt passive." (P01)
- "Generated text seems plausible but I have nothing to anchor it to." (P03)
- "Quick and probably 80% right but I wouldn't pass it on." (P06)

**On HITL-Full tasks:**
- "Slow at first, but I think I'd get faster with practice." (P02)
- "The chunk selector should be the default." (P04)
- "Wish there was a way to flag passages for follow-up." (P08)

---

## 4. What This Suggests for the Discussion Chapter

If real data lands close to this synthetic shape, the thesis discussion can lead with these claims:

1. **HITL controls produced a large, consistent gain in perceived control** (≈ +2.8 on Likert), much larger than gains in perceived accuracy or completeness (≈ +0.5–0.7). This would suggest HITL's primary contribution is procedural trust, not output quality per se — which lines up with the calibrated-trust framing in the literature.

2. **Citation helpfulness is mode-sensitive even when output looks similar.** The flip from majority "Partly/No" → majority "Yes" indicates that exposing retrieved chunks materially changes how participants perceive grounding, regardless of whether the underlying summary changed.

3. **Time-cost framing matters.** The 2× time penalty was acceptable to most participants for individual deep-dives but rejected for portfolio-scale workflows. This is a useful finding to position against the literature on AI productivity claims — the same tool can be net-positive or net-negative depending on the task scale.

4. **Mixed pool patterns.** Advanced learners derived an additional educational benefit not seen in professionals. If reproduced, this supports a secondary discussion on HITL as a scaffolding mechanism for less-experienced analysts.

5. **One dissenter is informative.** P05's mild Baseline preference (heavy AI user, values speed) would warrant its own paragraph. The pattern that the most AI-fluent participant least valued HITL is exactly the kind of nuance qualitative analysis is supposed to surface.

---

## 5. Caveats Before Real Data

- **N = 8 is too small for inferential claims.** Even if real data matches these patterns, the writeup must stay within descriptive + thematic framing.
- **Order effects are not fully controlled.** Alternated condition order is weaker than Latin-square. Watch for any systematic difference between "Full first" and "BL first" cohorts when real data arrives.
- **Self-report ≠ behaviour.** Edit volume, chunk rejection rates, and time-on-task from system telemetry should be reported alongside Likert scores to triangulate.
- **Synthetic ≠ predicted.** Real data may contradict any of the directions above. Treat this document as a planning aid, not a forecast.

---

## 6. Suggested Tables / Figures for the Thesis

If the real results follow this shape, candidate exhibits are:

1. **Table** — Mode comparison of Likert medians/means (analogue of §2.2)
2. **Figure** — Within-subject paired plot of Perceived Control across the two tasks
3. **Figure** — Stacked bar of Citation Helpfulness (Yes/Partly/No) by mode
4. **Table** — Mode preference matrix with reasoning summary (analogue of §3.1)
5. **Boxed quotes** — One per theme, integrated into discussion text

---

*This file is illustrative only. Replace with real findings once data collection completes.*
