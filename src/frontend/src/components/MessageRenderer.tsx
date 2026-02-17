import type { ReactNode } from "react";

import type { ChatMessage } from "../types";
import DynamicControlRenderer from "./controls/DynamicControlRenderer";
import EditableSummaryMessage from "./messages/EditableSummaryMessage";
import LoadingMessage from "./messages/LoadingMessage";
import RetrievedNodesMessage from "./messages/RetrievedNodesMessage";
import SectionSelectorMessage from "./messages/SectionSelectorMessage";
import SummaryMessage from "./messages/SummaryMessage";
import TraversalPathMessage from "./messages/TraversalPathMessage";

interface MessageRendererProps {
  message: ChatMessage;
  onSubmitNodeSelection: (
    taskId: string,
    selectedIds: string[],
    rejectedIds: string[],
    order: string[]
  ) => void;
  onSubmitEditedSummary: (taskId: string, editedText: string) => void;
  onCheckpointSubmit?: (instanceId: string, data: Record<string, unknown>) => void;
  onCheckpointSkip?: (instanceId: string) => void;
  onCheckpointRetry?: (instanceId: string) => void;
}

function TextBubble({
  role,
  content,
}: {
  role: "system" | "user" | "assistant";
  content: string;
}) {
  return <div className={`message-bubble ${role}`}>{content}</div>;
}

function AssistantBlock({ children }: { children: ReactNode }) {
  return <div className="assistant-block">{children}</div>;
}

export default function MessageRenderer({
  message,
  onSubmitNodeSelection,
  onSubmitEditedSummary,
  onCheckpointSubmit,
  onCheckpointSkip,
  onCheckpointRetry,
}: MessageRendererProps) {
  if (message.type === "text") {
    return <TextBubble role={message.role} content={message.content} />;
  }
  if (message.type === "loading") {
    return (
      <AssistantBlock>
        <LoadingMessage content={message.content} />
      </AssistantBlock>
    );
  }
  if (message.type === "traversal_path") {
    return (
      <AssistantBlock>
        <TraversalPathMessage steps={message.steps} />
      </AssistantBlock>
    );
  }
  if (message.type === "retrieved_nodes") {
    return (
      <AssistantBlock>
        <RetrievedNodesMessage nodes={message.nodes} />
      </AssistantBlock>
    );
  }
  if (message.type === "selector") {
    return (
      <AssistantBlock>
        <SectionSelectorMessage
          taskId={message.taskId}
          nodes={message.nodes}
          onSubmit={onSubmitNodeSelection}
        />
      </AssistantBlock>
    );
  }
  if (message.type === "editable_summary") {
    return (
      <AssistantBlock>
        <EditableSummaryMessage
          taskId={message.taskId}
          initialSummary={message.summary}
          onSubmit={onSubmitEditedSummary}
        />
      </AssistantBlock>
    );
  }
  if (message.type === "summary") {
    return (
      <AssistantBlock>
        <SummaryMessage summary={message.summary} />
      </AssistantBlock>
    );
  }
  // Exhaustive check - should never reach here
  return null;
}
