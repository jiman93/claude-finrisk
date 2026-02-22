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
    description: "Captures summary quality, perceived control, and feature feedback after generation.",
    field_schema: [
      {
        key: "completeness",
        type: "select",
        label: "How complete was this summary?",
        required: true,
        options: [
          { value: "1", label: "1 - Very incomplete" },
          { value: "2", label: "2 - Somewhat incomplete" },
          { value: "3", label: "3 - Acceptable" },
          { value: "4", label: "4 - Complete" },
          { value: "5", label: "5 - Very complete" },
        ],
      },
      {
        key: "accuracy",
        type: "select",
        label: "How accurate was this summary based on the retrieved documents?",
        required: true,
        options: [
          { value: "1", label: "1 - Very inaccurate" },
          { value: "2", label: "2 - Somewhat inaccurate" },
          { value: "3", label: "3 - Acceptable" },
          { value: "4", label: "4 - Accurate" },
          { value: "5", label: "5 - Very accurate" },
        ],
      },
      {
        key: "citation_helpfulness",
        type: "radio",
        label: "Were the source citations helpful for verifying the summary?",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "partly", label: "Partly" },
          { value: "no", label: "No" },
        ],
      },
      {
        key: "perceived_control",
        type: "select",
        label: "How much control did you have over the final summary?",
        required: true,
        options: [
          { value: "1", label: "1 - No control" },
          { value: "2", label: "2 - Little control" },
          { value: "3", label: "3 - Some control" },
          { value: "4", label: "4 - Good control" },
          { value: "5", label: "5 - Full control" },
        ],
      },
      {
        key: "feature_usefulness",
        type: "select",
        label: "How helpful was the feedback tool for improving the summary?",
        required: true,
        options: [
          { value: "1", label: "1 - Not helpful" },
          { value: "2", label: "2 - Slightly helpful" },
          { value: "3", label: "3 - Somewhat helpful" },
          { value: "4", label: "4 - Helpful" },
          { value: "5", label: "5 - Very helpful" },
        ],
      },
      {
        key: "open_feedback",
        type: "textarea",
        label: "Any concerns or observations about this task? (Optional)",
        required: false,
        placeholder: "Anything unclear or missing? Any issues with the tools?",
      },
    ],
    pipeline_position: "post_generation",
    sort_order: 0,
    applicable_modes: ["baseline", "hitl_r", "hitl_g", "hitl_full"],
    required: false,
    timeout_seconds: null,
    max_retries: 2,
    circuit_breaker_threshold: 5,
    circuit_breaker_window_minutes: 60,
    enabled: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-02-22T00:00:00Z",
  },
];

/** Ticker → Query mapping, mirroring study_setup.py */
export const QUERIES: Record<string, string> = {
  AAPL: "Identify and summarize the supply chain and geopolitical risks facing Apple's hardware operations.",
  AMZN: "What are Amazon's key operational and competitive risks in e-commerce and cloud services?",
  BA: "Summarize the safety, quality control, and litigation risks disclosed by Boeing.",
  MSFT: "What are the key technology and cybersecurity risks that could impact Microsoft's cloud business?",
  PFE: "What are the key regulatory approval and patent expiration risks affecting Pfizer's drug pipeline?",
  TSLA: "What regulatory and safety risks does Tesla face related to its autonomous driving technology?",
  WMT: "Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business.",
  XOM: "What environmental and regulatory compliance risks does ExxonMobil disclose related to climate policy?",
};

export const TICKERS = ["AAPL", "AMZN", "BA", "MSFT", "PFE", "TSLA", "WMT", "XOM"];
