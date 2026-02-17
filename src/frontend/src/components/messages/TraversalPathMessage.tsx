import type { TraversalStep } from "../../types";

interface TraversalPathMessageProps {
  steps: TraversalStep[];
}

export default function TraversalPathMessage({ steps }: TraversalPathMessageProps) {
  const selectSteps = steps.filter((s) => s.action === "select" && s.selected?.length);

  if (selectSteps.length === 0) return null;

  const path = selectSteps
    .map((step) => step.selected?.join(", ") ?? "")
    .filter(Boolean)
    .join(" > ");

  return (
    <div className="traversal-path">
      <span className="traversal-label">Navigated:</span> {path}
    </div>
  );
}
