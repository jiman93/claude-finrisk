from app.models.enums import GroupType, ModeType

# v2 study design: Tier 1-2 tickers only (AAPL, AMZN, MSFT)
# WMT reserved for tutorial
TICKERS = ["AAPL", "AMZN", "MSFT"]
TUTORIAL_TICKER = "WMT"

# Full query map (includes all tickers for backward compat)
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


def get_group(participant_id: str) -> GroupType:
    participant_num = parse_participant_index(participant_id)
    return GroupType.A if participant_num % 2 == 1 else GroupType.B


def get_phase_modes(participant_id: str) -> list[ModeType]:
    """v2: 2 modes, alternated order. Odd = baseline first, even = hitl_full first."""
    idx = parse_participant_index(participant_id)
    if idx % 2 == 1:
        return [ModeType.baseline, ModeType.hitl_full]
    return [ModeType.hitl_full, ModeType.baseline]


def get_ticker_sequence(participant_id: str) -> list[str]:
    """v2: 2 tickers from Tier 1-2 pool, no repetition within session."""
    idx = parse_participant_index(participant_id)
    offset = (idx - 1) % len(TICKERS)
    return [TICKERS[(offset + i) % len(TICKERS)] for i in range(len(get_phase_modes(participant_id)))]
