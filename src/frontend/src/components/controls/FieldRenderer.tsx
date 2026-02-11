import type { CheckpointFieldDef } from "../../types";

interface FieldRendererProps {
  field: CheckpointFieldDef;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
  error?: string;
}

export default function FieldRenderer({ field, value, onChange, disabled, error }: FieldRendererProps) {
  const id = `cp-field-${field.key}`;

  function renderInput() {
    switch (field.type) {
      case "text":
        return (
          <input
            id={id}
            type="text"
            className="pi-form-control"
            placeholder={field.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={disabled}
          />
        );

      case "textarea":
        return (
          <textarea
            id={id}
            className="pi-form-control pi-form-textarea"
            placeholder={field.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={disabled}
            rows={4}
          />
        );

      case "number":
        return (
          <input
            id={id}
            type="number"
            className="pi-form-control"
            placeholder={field.placeholder}
            value={(value as number) ?? ""}
            min={field.min}
            max={field.max}
            onChange={(e) => onChange(field.key, e.target.value === "" ? "" : Number(e.target.value))}
            disabled={disabled}
          />
        );

      case "range": {
        const numVal = typeof value === "number" ? value : field.min ?? 0;
        return (
          <div className="cp-range-wrap">
            <input
              id={id}
              type="range"
              className="cp-range-input"
              min={field.min ?? 0}
              max={field.max ?? 100}
              value={numVal}
              onChange={(e) => onChange(field.key, Number(e.target.value))}
              disabled={disabled}
            />
            <span className="cp-range-value">{numVal}</span>
          </div>
        );
      }

      case "select":
        return (
          <select
            id={id}
            className="pi-form-control"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={disabled}
          >
            <option value="">Select...</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="cp-radio-group">
            {(field.options ?? []).map((opt) => (
              <label key={opt.value} className="cp-radio-item">
                <input
                  type="radio"
                  name={id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(field.key, opt.value)}
                  disabled={disabled}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <label className="cp-checkbox-item">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(field.key, e.target.checked)}
              disabled={disabled}
            />
            <span>{field.label}</span>
          </label>
        );

      case "multi_select": {
        const selected = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="cp-multi-select-group">
            {(field.options ?? []).map((opt) => {
              const isChecked = selected.includes(opt.value);
              return (
                <label key={opt.value} className="cp-checkbox-item">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const next = isChecked
                        ? selected.filter((v) => v !== opt.value)
                        : [...selected, opt.value];
                      onChange(field.key, next);
                    }}
                    disabled={disabled}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case "chips": {
        const selected = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="cp-chips-group">
            {(field.options ?? []).map((opt) => {
              const isActive = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`cp-chip ${isActive ? "active" : ""}`}
                  onClick={() => {
                    if (disabled) return;
                    const next = isActive
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value];
                    onChange(field.key, next);
                  }}
                  disabled={disabled}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      }

      default:
        return (
          <div className="cp-unsupported">
            Unsupported field type: {field.type}
          </div>
        );
    }
  }

  return (
    <div className={`cp-field ${error ? "cp-field-error" : ""}`}>
      {field.type !== "checkbox" && (
        <label className="pi-form-label" htmlFor={id}>
          {field.label}
          {field.required && <span className="cp-required-star"> *</span>}
        </label>
      )}
      {renderInput()}
      {error && <div className="cp-field-error-msg">{error}</div>}
    </div>
  );
}
