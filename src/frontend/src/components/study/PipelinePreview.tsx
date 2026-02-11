import { useCallback, useState } from "react";

import { SEED_DEFINITIONS } from "../../data/checkpointDefinitions";
import type {
  CheckpointInstance,
  CheckpointState,
  PhaseAssignment,
  PipelinePosition,
} from "../../types";
import DynamicControlRenderer from "../controls/DynamicControlRenderer";

interface PipelinePreviewProps {
  participantId: string;
  group: "A" | "B";
  phases: PhaseAssignment[];
  /** Show only a single phase (1-indexed). If omitted, shows all phases. */
  singlePhase?: number;
}

function buildInstances(
  phase: PhaseAssignment,
  position: PipelinePosition
): CheckpointInstance[] {
  return phase.checkpoints
    .filter((cp) => cp.pipeline_position === position)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((cp) => {
      const def = SEED_DEFINITIONS.find((d) => d.id === cp.definition_id);
      return {
        id: `pp-${cp.definition_id}-${phase.phase}`,
        task_id: `preview-task-p${phase.phase}`,
        definition_id: cp.definition_id,
        control_type: cp.control_type,
        label: cp.label,
        state: "active" as CheckpointState,
        field_schema: def?.field_schema ?? [],
        payload: null,
        submit_result: null,
        required: def?.required ?? false,
        timeout_seconds: def?.timeout_seconds ?? null,
        attempt_count: 0,
        max_retries: def?.max_retries ?? 2,
        last_error: null,
        offered_at: new Date().toISOString(),
        submitted_at: null,
      };
    });
}

const MODE_LABELS: Record<string, string> = {
  baseline: "Baseline",
  hitl_r: "HITL-R",
  hitl_g: "HITL-G",
  hitl_full: "HITL-Full",
};

function PhaseFlow({ phase, participantId, group }: {
  phase: PhaseAssignment;
  participantId: string;
  group: "A" | "B";
}) {
  const [instances, setInstances] = useState(() => ({
    after_retrieval: buildInstances(phase, "after_retrieval"),
    after_generation: buildInstances(phase, "after_generation"),
    post_generation: buildInstances(phase, "post_generation"),
  }));

  const handleSubmit = useCallback((instanceId: string, data: Record<string, unknown>) => {
    setInstances((prev) => {
      const update = (list: CheckpointInstance[]) =>
        list.map((i) =>
          i.id === instanceId
            ? { ...i, state: "submitted" as CheckpointState, submit_result: data }
            : i
        );
      return {
        after_retrieval: update(prev.after_retrieval),
        after_generation: update(prev.after_generation),
        post_generation: update(prev.post_generation),
      };
    });
  }, []);

  const handleSkip = useCallback((instanceId: string) => {
    setInstances((prev) => {
      const update = (list: CheckpointInstance[]) =>
        list.map((i) =>
          i.id === instanceId ? { ...i, state: "skipped" as CheckpointState } : i
        );
      return {
        after_retrieval: update(prev.after_retrieval),
        after_generation: update(prev.after_generation),
        post_generation: update(prev.post_generation),
      };
    });
  }, []);

  const handleRetry = useCallback((instanceId: string) => {
    setInstances((prev) => {
      const update = (list: CheckpointInstance[]) =>
        list.map((i) =>
          i.id === instanceId
            ? { ...i, state: "active" as CheckpointState, last_error: null, offered_at: new Date().toISOString() }
            : i
        );
      return {
        after_retrieval: update(prev.after_retrieval),
        after_generation: update(prev.after_generation),
        post_generation: update(prev.post_generation),
      };
    });
  }, []);

  const positions: Array<{ key: keyof typeof instances; label: string }> = [
    { key: "after_retrieval", label: "After Retrieval" },
    { key: "after_generation", label: "After Generation" },
    { key: "post_generation", label: "Post Generation" },
  ];

  return (
    <div className="scp-pipeline-phase">
      <div className="scp-pipeline-phase-label">
        Phase {phase.phase} &mdash; {MODE_LABELS[phase.mode] ?? phase.mode} &bull; {phase.ticker}
      </div>

      <div className="cpd-pipeline-chat">
        <div className="pi-assistant-text" style={{ fontSize: 13, opacity: 0.7 }}>
          Session started for {participantId} (Group {group}). Phase {phase.phase} | {phase.mode} | {phase.ticker}
        </div>

        <div className="pi-user-bubble">{phase.query}</div>

        <div className="pi-step-card completed">
          <div className="pi-step-left">
            <span className="pi-step-icon">&#10003;</span>
            <span>Get document structure</span>
          </div>
          <div className="pi-step-right">34 sections scanned</div>
        </div>
        <div className="pi-step-card completed">
          <div className="pi-step-left">
            <span className="pi-step-icon">&#10003;</span>
            <span>Get page content</span>
          </div>
          <div className="pi-step-right">6 chunks &bull; 1,240 ms</div>
        </div>

        {positions.map(({ key, label }) => (
          <div key={key} className="cpd-pipeline-stage">
            <div className="cpd-pipeline-stage-label">
              <span className="cpd-pipeline-dot" />
              {label}
              <span className="cpd-pipeline-count">
                {instances[key].length} checkpoint{instances[key].length !== 1 ? "s" : ""}
              </span>
            </div>

            {instances[key].length === 0 && (
              <div className="cpd-pipeline-empty">No checkpoints at this position</div>
            )}

            {instances[key].map((inst) => (
              <DynamicControlRenderer
                key={inst.id}
                instance={inst}
                onSubmit={handleSubmit}
                onSkip={handleSkip}
                onRetry={handleRetry}
              />
            ))}

            {key === "after_retrieval" && (
              <>
                <div className="pi-step-card completed">
                  <div className="pi-step-left">
                    <span className="pi-step-icon">&#10003;</span>
                    <span>Synthesize answer</span>
                  </div>
                  <div className="pi-step-right">4 citations &bull; 860 ms</div>
                </div>
                <div className="pi-answer-card">
                  <div className="pi-answer-label">Generated summary</div>
                  <div className="pi-answer-text" style={{ maxHeight: 80, overflow: "hidden" }}>
                    Executive overview: {phase.ticker}&apos;s 10-K filing reveals a multi-factor risk profile
                    spanning key operational, regulatory, and market dimensions...
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        <div className="pi-run-meta pi-status-row">
          <span>Phase {phase.phase} flow completed.</span>
        </div>
      </div>
    </div>
  );
}

export default function PipelinePreview({
  participantId,
  group,
  phases,
  singlePhase,
}: PipelinePreviewProps) {
  const visiblePhases = singlePhase
    ? phases.filter((p) => p.phase === singlePhase)
    : phases;

  return (
    <div className="scp-pipeline-preview">
      {visiblePhases.map((phase, idx) => (
        <div key={phase.phase}>
          {idx > 0 && <div className="scp-pipeline-divider" />}
          <PhaseFlow
            phase={phase}
            participantId={participantId}
            group={group}
          />
        </div>
      ))}
    </div>
  );
}
