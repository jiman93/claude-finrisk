from app.models.enums import ModeType

# Quality tiers based on retrieval evaluation results:
# Tier 1 (90%+): WMT (100%), AMZN (93.3%), BA (100%)
# Tier 2 (80-89%): AAPL (88.2%), MSFT (80%)
# Tier 3 (75-79%): XOM (77.78%), PFE (75%), TSLA (75%)
TICKERS = ["AAPL", "AMZN", "BA", "MSFT", "PFE", "TSLA", "WMT", "XOM"]

# v2 study design: Tier 1-2 main task tickers; WMT reserved for tutorial
V2_MAIN_TICKERS = ["AMZN", "AAPL", "MSFT"]
TUTORIAL_TICKER = "WMT"

QUERIES = {
    "AAPL": "Identify and summarize the supply chain and geopolitical risks facing Apple's hardware operations.",
    "AMZN": "What are Amazon's key operational and competitive risks in e-commerce and cloud services?",
    "BA": "Summarize the safety, quality control, and litigation risks disclosed by Boeing.",
    "MSFT": "What are the key technology and cybersecurity risks that could impact Microsoft's cloud business?",
    "PFE": "What are the key regulatory approval and patent expiration risks affecting Pfizer's drug pipeline?",
    "TSLA": "What regulatory and safety risks does Tesla face related to its autonomous driving technology?",
    "WMT": "Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business.",
    "XOM": "What environmental and regulatory compliance risks does ExxonMobil disclose related to climate policy?",
}


def parse_participant_index(participant_id: str) -> int:
    return int(participant_id[1:])


def get_phase_modes(participant_id: str) -> list[ModeType]:
    """Return the ordered mode list for a participant.

    P00 is the tutorial-only participant: single HITL-Full phase.
    Odd participants (P01, P03, …) start with Baseline.
    Even participants (P02, P04, …) start with HITL-Full.
    """
    n = parse_participant_index(participant_id)
    if n == 0:
        return [ModeType.hitl_full]
    if n % 2 == 1:
        return [ModeType.baseline, ModeType.hitl_full]
    return [ModeType.hitl_full, ModeType.baseline]


def get_ticker_sequence(participant_id: str) -> list[str]:
    """Return the ordered ticker list for a participant.

    P00 gets only the tutorial ticker (WMT).
    Others get 2 tickers cycling through V2_MAIN_TICKERS.
    """
    n = parse_participant_index(participant_id)
    if n == 0:
        return [TUTORIAL_TICKER]
    offset = (n - 1) % len(V2_MAIN_TICKERS)
    t1 = V2_MAIN_TICKERS[offset]
    t2 = V2_MAIN_TICKERS[(offset + 1) % len(V2_MAIN_TICKERS)]
    return [t1, t2]
