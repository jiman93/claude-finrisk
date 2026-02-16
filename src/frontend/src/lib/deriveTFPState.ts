import type {
  ChatMessage,
  Mode,
  RetrievalNode,
  TFPState,
  TFPStepStatus,
} from "../types";

/**
 * Pure derivation: scans messages[] from the last phase_start and builds
 * a structured TFP state object.  Cheap linear scan (~30 messages max).
 */
export function deriveTFPState(
  messages: ChatMessage[],
  session: { current_phase: number; current_mode: Mode; current_ticker: string; current_query: string } | null,
): TFPState {
  const empty: TFPState = {
    taskDefinition: null,
    evidence: null,
    summary: null,
    checkpoints: [],
    pipelineSteps: [],
  };

  if (!session || messages.length === 0) return empty;

  // ── Find last phase_start to scope to current phase ──────────────────
  let phaseIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].type === "phase_start") {
      phaseIdx = i;
      break;
    }
  }
  const phaseMessages = phaseIdx >= 0 ? messages.slice(phaseIdx) : messages;

  // ── Section 1: Task Definition ───────────────────────────────────────
  let taskDefinition: TFPState["taskDefinition"] = null;
  const phaseStart = phaseMessages.find((m) => m.type === "phase_start");
  if (phaseStart && phaseStart.type === "phase_start") {
    taskDefinition = {
      phase: phaseStart.phase,
      mode: phaseStart.mode,
      ticker: phaseStart.ticker,
      query: phaseStart.query,
    };
  }

  // ── Section 2: Evidence Framework ────────────────────────────────────
  let evidence: TFPState["evidence"] = null;
  let retrievedNodes: RetrievalNode[] = [];
  let selectedNodeIds: string[] | null = null;

  // Find last retrieved_nodes in current phase
  for (let i = phaseMessages.length - 1; i >= 0; i--) {
    const m = phaseMessages[i];
    if (m.type === "retrieved_nodes") {
      retrievedNodes = m.nodes;
      break;
    }
  }

  // Find last submitted selector in current phase
  for (let i = phaseMessages.length - 1; i >= 0; i--) {
    const m = phaseMessages[i];
    if (m.type === "selector" && m.submitted) {
      selectedNodeIds = m.nodes.map((n) => n.node_id);
      break;
    }
  }

  if (retrievedNodes.length > 0) {
    const total = retrievedNodes.length;
    const selected = selectedNodeIds ? selectedNodeIds.length : total;
    evidence = {
      retrievedNodes,
      selectedNodeIds,
      coverageRatio: total > 0 ? selected / total : 0,
    };
  }

  // ── Section 3: Summary State ─────────────────────────────────────────
  let summary: TFPState["summary"] = null;
  let generatedText: string | null = null;
  let editedText: string | null = null;

  for (const m of phaseMessages) {
    if (m.type === "editable_summary") {
      generatedText = m.summary;
    } else if (m.type === "summary") {
      // If we already have generated text from editable_summary,
      // this summary is the edited/final version
      if (generatedText) {
        editedText = m.summary;
      } else {
        generatedText = m.summary;
      }
    }
  }

  if (generatedText) {
    summary = {
      generatedText,
      editedText,
      wasEdited: editedText !== null && editedText !== generatedText,
    };
  }

  // ── Section 4: Checkpoint Responses ──────────────────────────────────
  const checkpoints: TFPState["checkpoints"] = [];
  for (const m of phaseMessages) {
    if (m.type === "submitted_checkpoint") {
      checkpoints.push({
        definitionId: m.definitionId,
        label: m.label,
        state: m.state,
        fields: m.fields,
      });
    }
  }

  // ── Section 5: Workflow Progress ─────────────────────────────────────
  const hasRetrieval = phaseMessages.some((m) => m.type === "retrieved_nodes");
  const hasSelector = phaseMessages.some(
    (m) => m.type === "selector" && m.submitted,
  );
  const hasSelectorPending = phaseMessages.some(
    (m) => m.type === "selector" && !m.submitted,
  );
  const hasGeneration = generatedText !== null;
  const hasEditing = editedText !== null;
  const hasCheckpoints = checkpoints.length > 0;

  // Determine current mode to know which steps apply
  const mode = taskDefinition?.mode ?? session.current_mode;
  const needsSelection = mode === "hitl_r" || mode === "hitl_full";
  const needsEditing = mode === "hitl_g" || mode === "hitl_full";

  const pipelineSteps: TFPStepStatus[] = [
    {
      step: "retrieval",
      label: "Retrieval",
      status: hasRetrieval ? "completed" : "pending",
    },
  ];

  if (needsSelection) {
    pipelineSteps.push({
      step: "selection",
      label: "Chunk Selection",
      status: hasSelector
        ? "completed"
        : hasSelectorPending
          ? "active"
          : "pending",
    });
  }

  pipelineSteps.push({
    step: "generation",
    label: "Summary Generation",
    status: hasGeneration ? "completed" : "pending",
  });

  if (needsEditing) {
    pipelineSteps.push({
      step: "editing",
      label: "Summary Editing",
      status: hasEditing ? "completed" : hasGeneration ? "active" : "pending",
    });
  }

  pipelineSteps.push({
    step: "checkpoints",
    label: "Checkpoints",
    status: hasCheckpoints ? "completed" : "pending",
  });

  return {
    taskDefinition,
    evidence,
    summary,
    checkpoints,
    pipelineSteps,
  };
}
