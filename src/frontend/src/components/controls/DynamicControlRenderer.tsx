import { type FormEvent, useCallback, useState } from "react";

import type { CheckpointInstance } from "../../types";
import CheckpointErrorBoundary from "./CheckpointErrorBoundary";
import CheckpointTimeoutBar from "./CheckpointTimeoutBar";
import FieldRenderer from "./FieldRenderer";

interface DynamicControlRendererProps {
  instance: CheckpointInstance;
  onSubmit: (instanceId: string, data: Record<string, unknown>) => void;
  onSkip: (instanceId: string) => void;
  onRetry: (instanceId: string) => void;
  disabled?: boolean;
}

function buildDefaults(instance: CheckpointInstance): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of instance.field_schema) {
    if (field.default !== undefined) {
      defaults[field.key] = field.default;
    } else if (field.type === "multi_select" || field.type === "chips") {
      defaults[field.key] = [];
    } else if (field.type === "checkbox") {
      defaults[field.key] = false;
    } else {
      defaults[field.key] = "";
    }
  }
  return defaults;
}

function validateForm(
  instance: CheckpointInstance,
  data: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of instance.field_schema) {
    if (!field.required) continue;
    const val = data[field.key];
    if (val === undefined || val === null || val === "") {
      errors[field.key] = "This field is required";
    } else if (Array.isArray(val) && val.length === 0) {
      errors[field.key] = "Select at least one option";
    }
  }
  return errors;
}

function DynamicControlInner({
  instance,
  onSubmit,
  onSkip,
  onRetry,
  disabled,
}: DynamicControlRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(
    () => (instance.submit_result as Record<string, unknown>) ?? buildDefaults(instance)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleTimeout = useCallback(() => {
    if (!instance.required) {
      onSkip(instance.id);
    }
  }, [instance.id, instance.required, onSkip]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validateForm(instance, formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    onSubmit(instance.id, formData);
  }

  // ── Collapsed state: submitted or skipped ──
  if (instance.state === "submitted" || instance.state === "collapsed") {
    const result = instance.submit_result ?? formData;
    return (
      <div className="cp-control-card cp-collapsed">
        <div className="cp-control-header">
          <span className="cp-control-icon cp-icon-success">&#10003;</span>
          <span className="cp-control-title">{instance.label}</span>
          <span className="cp-control-badge submitted">Submitted</span>
        </div>
        <div className="cp-collapsed-summary">
          {instance.field_schema.map((field) => {
            const val = result[field.key];
            if (val === undefined || val === null || val === "") return null;
            const display = Array.isArray(val) ? val.join(", ") : String(val);
            return (
              <div key={field.key} className="cp-collapsed-row">
                <span className="cp-collapsed-label">{field.label}:</span>
                <span className="cp-collapsed-value">{display}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (instance.state === "skipped") {
    return (
      <div className="cp-control-card cp-collapsed">
        <div className="cp-control-header">
          <span className="cp-control-icon cp-icon-skip">&#8594;</span>
          <span className="cp-control-title">{instance.label}</span>
          <span className="cp-control-badge skipped">Skipped</span>
        </div>
      </div>
    );
  }

  if (instance.state === "timed_out") {
    return (
      <div className="cp-control-card cp-collapsed">
        <div className="cp-control-header">
          <span className="cp-control-icon cp-icon-timeout">&#9201;</span>
          <span className="cp-control-title">{instance.label}</span>
          <span className="cp-control-badge timed-out">Timed Out</span>
        </div>
        <div className="cp-error-actions">
          <button
            type="button"
            className="pi-secondary-btn"
            onClick={() => onRetry(instance.id)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Failed state ──
  if (instance.state === "failed") {
    const canRetry = instance.attempt_count < instance.max_retries;
    return (
      <div className="cp-control-card cp-failed">
        <div className="cp-control-header">
          <span className="cp-control-icon cp-icon-error">!</span>
          <span className="cp-control-title">{instance.label}</span>
          <span className="cp-control-badge failed">Failed</span>
        </div>
        <div className="cp-error-detail">
          {instance.last_error ?? "An error occurred"}
          <span className="cp-attempt-count">
            Attempt {instance.attempt_count}/{instance.max_retries}
          </span>
        </div>
        <div className="cp-error-actions">
          {canRetry && (
            <button
              type="button"
              className="pi-secondary-btn"
              onClick={() => onRetry(instance.id)}
            >
              Retry
            </button>
          )}
          {!instance.required && (
            <button
              type="button"
              className="pi-secondary-btn"
              onClick={() => onSkip(instance.id)}
            >
              Skip
            </button>
          )}
          {!canRetry && instance.required && (
            <div className="cp-terminal-error">
              This required checkpoint has exceeded maximum retries. Contact support.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Active state: render the form ──
  const isActive = instance.state === "active" || instance.state === "offered" || instance.state === "pending";

  return (
    <form className="cp-control-card cp-active" onSubmit={handleSubmit}>
      <div className="cp-control-header">
        <span className="cp-control-icon cp-icon-active">&#9671;</span>
        <span className="cp-control-title">{instance.label}</span>
        {instance.required && <span className="cp-control-badge required">Required</span>}
        {!instance.required && <span className="cp-control-badge optional">Optional</span>}
      </div>

      {instance.timeout_seconds && instance.offered_at && isActive && (
        <CheckpointTimeoutBar
          timeoutSeconds={instance.timeout_seconds}
          startedAt={instance.offered_at}
          onTimeout={handleTimeout}
          paused={disabled || isSubmitting}
        />
      )}

      <div className="cp-control-fields">
        {instance.field_schema.map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={formData[field.key]}
            onChange={handleChange}
            disabled={disabled || isSubmitting}
            error={errors[field.key]}
          />
        ))}
      </div>

      <div className="cp-control-actions">
        <button
          type="submit"
          className="pi-primary-btn"
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        {!instance.required && (
          <button
            type="button"
            className="pi-secondary-btn"
            onClick={() => onSkip(instance.id)}
            disabled={disabled || isSubmitting}
          >
            Skip
          </button>
        )}
      </div>
    </form>
  );
}

export default function DynamicControlRenderer(props: DynamicControlRendererProps) {
  return (
    <CheckpointErrorBoundary
      controlType={props.instance.control_type}
      required={props.instance.required}
      onSkip={() => props.onSkip(props.instance.id)}
      onRetry={() => props.onRetry(props.instance.id)}
    >
      <DynamicControlInner {...props} />
    </CheckpointErrorBoundary>
  );
}
