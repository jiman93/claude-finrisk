from app.models.enums import GroupType, ModeType

# Quality tiers based on retrieval evaluation results:
# Tier 1 (90%+): WMT (100%), AMZN (93.3%), BA (100%)
# Tier 2 (80-89%): AAPL (88.2%), MSFT (80%)
# Tier 3 (75-79%): XOM (77.78%), PFE (75%), TSLA (75%)
TICKERS = ["AAPL", "AMZN", "BA", "MSFT", "PFE", "TSLA", "WMT", "XOM"]

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


def get_phase_modes(group: GroupType) -> list[ModeType]:
    if group == GroupType.A:
        return [ModeType.baseline, ModeType.hitl_r, ModeType.hitl_full]
    return [ModeType.baseline, ModeType.hitl_g, ModeType.hitl_full]


def get_ticker_sequence(participant_id: str) -> list[str]:
    participant_num = parse_participant_index(participant_id)
    offset = ((participant_num - 1) // 2) % len(TICKERS)
    seq = [TICKERS[(offset + i) % len(TICKERS)] for i in range(3)]
    return seq
