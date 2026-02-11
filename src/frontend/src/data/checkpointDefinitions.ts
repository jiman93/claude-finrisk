import type { CheckpointDefinition } from "../types";

/**
 * Seed checkpoint definitions shared between CheckpointDashboard and Study Control Panel.
 * In a future iteration these would be fetched from a /api/checkpoints endpoint.
 */
export const SEED_DEFINITIONS: CheckpointDefinition[] = [
  {
    id: "seed-chunk-selector",
    control_type: "chunk_selector",
    label: "Chunk Selector (HITL-R)",
    description: "User selects which retrieved document chunks to include in generation.",
    field_schema: [],
    pipeline_position: "after_retrieval",
    sort_order: 0,
    applicable_modes: ["hitl_r", "hitl_full"],
    required: true,
    timeout_seconds: null,
    max_retries: 2,
    circuit_breaker_threshold: 5,
    circuit_breaker_window_minutes: 60,
    enabled: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "seed-summary-editor",
    control_type: "summary_editor",
    label: "Summary Editor (HITL-G)",
    description: "User edits the AI-generated summary before finalization.",
    field_schema: [],
    pipeline_position: "after_generation",
    sort_order: 0,
    applicable_modes: ["hitl_g", "hitl_full"],
    required: true,
    timeout_seconds: null,
    max_retries: 2,
    circuit_breaker_threshold: 5,
    circuit_breaker_window_minutes: 60,
    enabled: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "seed-questionnaire",
    control_type: "questionnaire",
    label: "Post-Generation Questionnaire",
    description: "Captures user confidence and citation feedback after generation.",
    field_schema: [
      {
        key: "confidence",
        type: "select",
        label: "Confidence in this summary",
        required: true,
        options: [
          { value: "1", label: "1 - Very low" },
          { value: "2", label: "2 - Low" },
          { value: "3", label: "3 - Medium" },
          { value: "4", label: "4 - High" },
          { value: "5", label: "5 - Very high" },
        ],
      },
      {
        key: "citation_helpfulness",
        type: "radio",
        label: "Were citations helpful?",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "partly", label: "Partly" },
          { value: "no", label: "No" },
        ],
      },
      {
        key: "notes",
        type: "textarea",
        label: "Additional notes",
        required: false,
        placeholder: "Anything unclear or missing?",
      },
    ],
    pipeline_position: "post_generation",
    sort_order: 0,
    applicable_modes: ["hitl_r", "hitl_g", "hitl_full"],
    required: false,
    timeout_seconds: null,
    max_retries: 2,
    circuit_breaker_threshold: 5,
    circuit_breaker_window_minutes: 60,
    enabled: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

/** Ticker → Query mapping, mirroring study_setup.py */
export const QUERIES: Record<string, string> = {
  MSFT: "What are the key technology and cybersecurity risks that could impact Microsoft's cloud business?",
  AAPL: "Identify and summarize the supply chain and geopolitical risks facing Apple's hardware operations.",
  TSLA: "What regulatory and safety risks does Tesla face related to its autonomous driving technology?",
  JPM: "Summarize the credit risk and market volatility exposures disclosed by JPMorgan Chase.",
  PFE: "What are the key regulatory approval and patent expiration risks affecting Pfizer's drug pipeline?",
  WMT: "Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business.",
  XOM: "What environmental and regulatory compliance risks does ExxonMobil disclose related to climate policy?",
  BA: "Summarize the safety, quality control, and litigation risks disclosed by Boeing.",
};

export const TICKERS = ["MSFT", "AAPL", "TSLA", "JPM", "PFE", "WMT", "XOM", "BA"];
