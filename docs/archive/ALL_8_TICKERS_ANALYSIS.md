# Using All 8 Tickers for User Study: Analysis

**Date:** 2026-02-22
**Scenario:** Include all 8 tickers regardless of quality gate status
**Configuration:** top-k=10, 80% threshold (standardized)

---

## Current Status Summary

| Ticker | Pass/Fail | Retrieval | Issues | Sector |
|--------|-----------|-----------|--------|--------|
| **WMT** | ✅ PASS | 100% | None | Retail |
| **BA** | ⚠️ Advisory | 100% | Financial statements gap (benign) | Aerospace |
| **AMZN** | ✅ PASS | 93.3% | None | Tech (E-commerce) |
| **AAPL** | ✅ PASS | 88.2% | None | Tech (Consumer electronics) |
| **MSFT** | ✅ PASS | 80.0% | Zero margin (exactly at threshold) | Tech (Software) |
| **XOM** | ❌ FAIL | 77.8% | Missing Item 1, 2.2% below threshold | Energy |
| **PFE** | ❌ FAIL | 75.0% | 5% below threshold | Pharmaceutical |
| **TSLA** | ❌ FAIL | 75.0% | 5% below threshold | Automotive |

---

## Quality Tier Classification

### Tier 1: Excellent (90%+)
**Tickers:** WMT (100%), BA (100%), AMZN (93.3%)

**Characteristics:**
- Very high retrieval accuracy (90%+)
- All or nearly all queries work
- Minimal user frustration expected
- Can handle complex queries

**User study impact:**
- High confidence in results
- Good user experience
- Reliable for benchmarking

---

### Tier 2: Good (80-89%)
**Tickers:** AAPL (88.2%), MSFT (80.0%)

**Characteristics:**
- Good retrieval accuracy
- Most queries work (4 out of 5)
- Some edge cases may fail
- Generally reliable

**User study impact:**
- Acceptable user experience
- Occasional frustration possible
- MSFT at exact threshold is fragile

---

### Tier 3: Acceptable (75-79%)
**Tickers:** XOM (77.8%), PFE (75%), TSLA (75%)

**Characteristics:**
- Lower retrieval accuracy
- 1 in 4-5 queries may fail
- More noticeable gaps
- Structural issues (XOM missing Item 1)

**User study impact:**
- Higher frustration risk
- May bias results negatively
- Could still provide useful data with caveats

---

## Pros of Using All 8 Tickers

### 1. Maximum Diversity

**Sector coverage:**
- **Tech:** AAPL, AMZN, MSFT (3 tickers - cloud, e-commerce, consumer electronics)
- **Aerospace:** BA (1 ticker)
- **Retail:** WMT (1 ticker)
- **Pharmaceutical:** PFE (1 ticker)
- **Automotive:** TSLA (1 ticker)
- **Energy:** XOM (1 ticker)

**Benefits:**
- Broad industry representation
- Can test domain-specific queries
- More generalizable findings
- Appeals to diverse user interests

---

### 2. Larger Sample Size

**Statistical benefits:**
- More data points per user
- Can stratify analysis by quality tier
- Increases statistical power
- Can identify quality-dependent patterns

**Study design:**
- Each user interacts with multiple tickers
- Can compare within-user across quality tiers
- Observe learning effects across tickers

---

### 3. Real-World Quality Spectrum

**Reflects reality:**
- Not all document parsing is perfect
- Users will encounter varying quality in production
- Tests robustness of interface design
- Identifies minimum acceptable quality threshold

**Research value:**
- Can measure user tolerance for errors
- Understand quality vs. usability trade-off
- Identify critical failure modes

---

### 4. Flexibility in Analysis

**Can analyze multiple ways:**
- **All tickers combined** - Overall patterns
- **By quality tier** - Impact of retrieval accuracy
- **By sector** - Domain-specific insights
- **High quality only** - Best-case performance

**Subset analysis:**
- Can always exclude low-quality tickers post-hoc
- Can't add them back if not included initially
- Maximum analytical flexibility

---

## Cons of Using All 8 Tickers

### 1. Inconsistent User Experience

**Quality varies significantly:**
- WMT/BA: 100% success rate
- PFE/TSLA: 75% success rate (1 in 4 queries fail)
- 25% failure rate may frustrate users

**Risk:**
- Users judge system by worst experience
- Negative experiences with Tier 3 tickers bias overall perception
- "This doesn't work" impression from failed queries

**Mitigation:**
- Set expectations upfront (quality varies)
- Stratified assignment (ensure each user gets high-quality tickers)
- Collect feedback per ticker

---

### 2. Confounding Variables

**Hard to isolate effects:**
- Query failure due to retrieval vs. user query formulation?
- User frustration due to system vs. ticker quality?
- Interface issues vs. content quality issues?

**Analysis complexity:**
- Need to control for quality tier in analysis
- Smaller effective sample size per tier
- May need more participants

---

### 3. Specific Ticker Issues

#### XOM (77.8%, Missing Item 1)
**Problem:** Missing "Item 1. Business" heading
- Users looking for business description may fail
- Structural gap could confuse users
- 77.8% means ~2 in 9 queries fail

**Impact:** MEDIUM-HIGH
- Functional for risk factor queries (Item 1A present)
- Problematic for business overview queries

---

#### PFE (75%)
**Problem:** 5% below threshold, 2 in 8 queries fail
- No structural issues, just lower accuracy
- Page gaps (benign)

**Impact:** MEDIUM
- May frustrate users occasionally
- But 75% still means 3 in 4 queries work

---

#### TSLA (75%)
**Problem:** 5% below threshold, 2 in 8 queries fail
- Similar to PFE
- Borderline acceptable quality

**Impact:** MEDIUM
- May frustrate users occasionally
- TSLA subject may be interesting to users (Tesla brand)

---

### 4. Potential for Negative Bias

**Psychological impact:**
- One bad experience can overshadow many good ones
- Users may generalize from Tier 3 failures to entire system
- Could bias study results negatively

**Especially risky if:**
- Users start with a Tier 3 ticker (bad first impression)
- Multiple consecutive failures occur
- User task requires Tier 3 ticker for completion

---

## Risk Analysis

### Scenario 1: User Gets WMT or BA First
**Outcome:** Positive
- 100% success rate → confident in system
- Sets positive expectations
- Likely to persist through later failures
- **Recommendation:** Always start users with Tier 1 ticker

---

### Scenario 2: User Gets PFE or TSLA First
**Outcome:** Risky
- 75% success rate → immediate failures possible
- May abandon system early
- Negative first impression
- **Recommendation:** Never start with Tier 3

---

### Scenario 3: Mixed Experience
**Outcome:** Variable
- Good tickers establish trust
- Bad tickers test tolerance
- Order effects matter significantly
- **Recommendation:** Deliberate ordering (high → medium → low quality)

---

## Mitigation Strategies

### 1. Tiered Assignment with Disclosure

**Approach:**
```
"You'll interact with 8 different companies. Some will work better than others -
this reflects real-world document quality. Please rate each company separately."
```

**Benefits:**
- Sets realistic expectations
- Users understand it's intentional
- Can collect quality-specific feedback

**Implementation:**
- Label tickers by tier (or don't reveal tier to avoid bias)
- Ask "How well did retrieval work for this company?" per ticker
- Collect satisfaction scores per ticker

---

### 2. Stratified Ticker Assignment

**Ensure each user gets:**
- At least 2 Tier 1 tickers (high quality anchor)
- At least 1 Tier 2 ticker (good quality)
- No more than 2 Tier 3 tickers (limit frustration)

**Example assignment:**
- User 1: WMT, AMZN, AAPL, PFE (2 Tier 1, 1 Tier 2, 1 Tier 3)
- User 2: BA, MSFT, TSLA, XOM (1 Tier 1, 1 Tier 2, 2 Tier 3)

---

### 3. Ordering: High to Low Quality

**Present tickers in order:**
1. Tier 1 (100%, 93%) - Build confidence
2. Tier 2 (88%, 80%) - Maintain trust
3. Tier 3 (78%, 75%, 75%) - Test tolerance

**Rationale:**
- Establish positive baseline
- Users more forgiving after good experiences
- Can measure degradation tolerance

---

### 4. Per-Ticker Feedback

**Collect after each ticker:**
- "How satisfied were you with the results for [TICKER]?" (1-5 scale)
- "Did you find what you were looking for?" (Yes/No)
- "Any issues or frustrations?" (Open text)

**Analysis:**
- Correlate satisfaction with retrieval quality
- Identify quality threshold for acceptable UX
- Separate ticker quality from interface quality

---

### 5. Exclusion Criteria (Post-hoc)

**Can exclude Tier 3 in analysis if:**
- Satisfaction scores significantly lower
- Completion rates significantly lower
- Qualitative feedback indicates quality issues

**Benefit:**
- Collect data now, decide later
- Don't lose opportunity to gather Tier 3 data
- Can compare "all tickers" vs "high quality only"

---

## Recommended Approach: Use All 8 with Tiered Design

### Study Design

**Phase 1: Practice/Onboarding**
- Use Tier 1 ticker (WMT or AMZN) for tutorial
- Ensures users learn with high-quality experience

**Phase 2: Primary Tasks**
- Assign 3-4 tickers per user (stratified)
- Always include at least 1 Tier 1, 1 Tier 2
- Limit Tier 3 to 1-2 per user

**Phase 3: Feedback**
- Per-ticker satisfaction ratings
- Overall system satisfaction
- Quality tolerance questions

---

### Ticker Assignment Matrix

| User | Tier 1 | Tier 2 | Tier 3 | Total |
|------|--------|--------|--------|-------|
| 1 | WMT, AMZN | AAPL | PFE | 4 |
| 2 | BA, AMZN | MSFT | TSLA | 4 |
| 3 | WMT, BA | AAPL | XOM | 4 |
| 4 | AMZN | AAPL, MSFT | PFE, TSLA | 4 |
| 5 | WMT | MSFT | XOM | 3 |

**Ensures:**
- Every user gets high-quality anchor
- Balanced exposure across tickers
- Can analyze by tier

---

### Analysis Plan

**Primary analysis:**
- Use only Tier 1+2 tickers (5 tickers: WMT, BA, AMZN, AAPL, MSFT)
- High confidence in results
- Consistent quality (80-100%)

**Secondary analysis:**
- Include Tier 3 to test quality tolerance
- Stratify by tier
- Compare satisfaction scores

**Exploratory:**
- Identify minimum acceptable quality
- Quality-satisfaction correlation
- Failure recovery patterns

---

## Decision Matrix

### Use All 8 Tickers If:

✅ **Research goals include:**
- Understanding quality tolerance
- Testing robustness across quality levels
- Maximum diversity needed

✅ **Study design includes:**
- Stratified assignment
- Per-ticker feedback
- Deliberate ordering (high to low)

✅ **You can:**
- Recruit enough participants for stratified design
- Collect per-ticker satisfaction scores
- Analyze by tier

---

### Use Only 4-5 High-Quality Tickers If:

✅ **Research goals include:**
- Demonstrating best-case performance
- Minimizing user frustration
- Clear, unambiguous results

✅ **Study constraints:**
- Limited participants
- Need consistent quality
- Can't afford negative bias

✅ **You want:**
- Simple analysis
- High confidence results
- Minimal confounds

---

## My Recommendation: **Use All 8 with Tiered Approach**

### Rationale

1. **Flexibility:** Collect data now, decide later
   - Can always exclude Tier 3 in analysis
   - Can't add them back if not collected

2. **Research value:** Quality tolerance is important
   - Real systems have variable quality
   - Need to understand minimum acceptable threshold
   - Tier 3 data is scientifically valuable

3. **Mitigation is feasible:**
   - Stratified assignment is straightforward
   - Per-ticker feedback is easy to collect
   - Ordering effects can be controlled

4. **Sector diversity matters:**
   - 8 tickers > 5 tickers for generalizability
   - Energy (XOM) and Pharma (PFE) add important domains
   - TSLA has strong brand recognition

---

### Implementation Checklist

- [ ] **Stratified assignment:** Ensure each user gets mix of tiers
- [ ] **Ordering:** Start with Tier 1, end with Tier 3
- [ ] **Disclosure:** Tell users quality varies (or don't, for unbiased feedback)
- [ ] **Per-ticker feedback:** Collect satisfaction per company
- [ ] **Analysis plan:** Primary (Tier 1+2) + Secondary (all tiers)
- [ ] **Exclusion criteria:** Define post-hoc exclusion rules
- [ ] **Sample size:** Calculate needed N for stratified design

---

## Alternative: Conservative Approach (5 Tickers)

If you want to minimize risk:

**Use:** WMT, BA, AMZN, AAPL, MSFT (Tiers 1-2 only)

**Pros:**
- Consistent 80-100% quality
- Lower frustration risk
- Simpler analysis
- Still good diversity (tech, aerospace, retail)

**Cons:**
- No pharma/energy/automotive sectors
- Can't measure quality tolerance
- Less data overall

---

## Final Recommendation

### **Use all 8 tickers with the following design:**

**Tier 1 (Primary):** WMT, BA, AMZN (100%, 100%, 93%)
- Use for onboarding/tutorial
- Anchor positive expectations

**Tier 2 (Secondary):** AAPL, MSFT (88%, 80%)
- Main study tasks
- Good quality, reliable

**Tier 3 (Exploratory):** XOM, PFE, TSLA (78%, 75%, 75%)
- Optional tasks
- Quality tolerance testing
- Can exclude from primary analysis

**Assignment:** Each user gets 3-4 tickers
- Always start with Tier 1
- At least 2 from Tier 1+2
- Maximum 1-2 from Tier 3

**Analysis:**
- **Primary:** Tier 1+2 only (conservative, high confidence)
- **Secondary:** All tiers (exploratory, quality effects)
- **Per-ticker:** Satisfaction by quality level

---

**This gives you maximum flexibility while managing risk.**

