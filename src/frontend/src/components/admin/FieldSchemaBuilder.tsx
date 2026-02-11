import { useCallback } from "react";

import type { CheckpointFieldDef, CheckpointFieldType } from "../../types";

const FIELD_TYPES: Array<{ value: CheckpointFieldType; label: string }> = [
  { value: "text", label: "Text input" },
  { value: "textarea", label: "Text area" },
  { value: "select", label: "Dropdown" },
  { value: "multi_select", label: "Multi-select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio buttons" },
  { value: "number", label: "Number" },
  { value: "range", label: "Range slider" },
  { value: "chips", label: "Chip tags" },
];

const TYPES_WITH_OPTIONS = new Set<CheckpointFieldType>([
  "select",
  "multi_select",
  "radio",
  "chips",
]);
const TYPES_WITH_MIN_MAX = new Set<CheckpointFieldType>(["number", "range"]);

interface FieldSchemaBuilderProps {
  fields: CheckpointFieldDef[];
  onChange: (fields: CheckpointFieldDef[]) => void;
}

function makeEmptyField(): CheckpointFieldDef {
  return {
    key: `field_${Date.now().toString(36)}`,
    type: "text",
    label: "",
    required: false,
  };
}

export default function FieldSchemaBuilder({ fields, onChange }: FieldSchemaBuilderProps) {
  const updateField = useCallback(
    (index: number, patch: Partial<CheckpointFieldDef>) => {
      const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
      onChange(next);
    },
    [fields, onChange]
  );

  const removeField = useCallback(
    (index: number) => {
      onChange(fields.filter((_, i) => i !== index));
    },
    [fields, onChange]
  );

  const moveField = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= fields.length) return;
      const next = [...fields];
      [next[index], next[target]] = [next[target], next[index]];
      onChange(next);
    },
    [fields, onChange]
  );

  const addField = useCallback(() => {
    onChange([...fields, makeEmptyField()]);
  }, [fields, onChange]);

  function addOption(fieldIndex: number) {
    const field = fields[fieldIndex];
    const options = [...(field.options ?? []), { value: "", label: "" }];
    updateField(fieldIndex, { options });
  }

  function updateOption(
    fieldIndex: number,
    optionIndex: number,
    key: "value" | "label",
    val: string
  ) {
    const field = fields[fieldIndex];
    const options = (field.options ?? []).map((opt, i) =>
      i === optionIndex ? { ...opt, [key]: val } : opt
    );
    updateField(fieldIndex, { options });
  }

  function removeOption(fieldIndex: number, optionIndex: number) {
    const field = fields[fieldIndex];
    const options = (field.options ?? []).filter((_, i) => i !== optionIndex);
    updateField(fieldIndex, { options });
  }

  return (
    <div className="fsb-container">
      <div className="fsb-header">
        <span className="fsb-title">Field Schema</span>
        <span className="fsb-count">{fields.length} field{fields.length !== 1 ? "s" : ""}</span>
      </div>

      {fields.length === 0 && (
        <div className="fsb-empty">No fields defined. Add a field to start.</div>
      )}

      <div className="fsb-list">
        {fields.map((field, index) => (
          <div key={field.key} className="fsb-field-card">
            <div className="fsb-field-topbar">
              <span className="fsb-field-index">#{index + 1}</span>
              <div className="fsb-field-controls">
                <button
                  type="button"
                  className="fsb-move-btn"
                  onClick={() => moveField(index, -1)}
                  disabled={index === 0}
                  title="Move up"
                >
                  &#8593;
                </button>
                <button
                  type="button"
                  className="fsb-move-btn"
                  onClick={() => moveField(index, 1)}
                  disabled={index === fields.length - 1}
                  title="Move down"
                >
                  &#8595;
                </button>
                <button
                  type="button"
                  className="fsb-remove-btn"
                  onClick={() => removeField(index)}
                  title="Remove field"
                >
                  &#10005;
                </button>
              </div>
            </div>

            <div className="fsb-field-row">
              <div className="fsb-field-col">
                <label className="fsb-label">Label</label>
                <input
                  type="text"
                  className="pi-form-control"
                  placeholder="e.g. Confidence rating"
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                />
              </div>
              <div className="fsb-field-col fsb-col-narrow">
                <label className="fsb-label">Key</label>
                <input
                  type="text"
                  className="pi-form-control"
                  placeholder="e.g. confidence"
                  value={field.key}
                  onChange={(e) =>
                    updateField(index, {
                      key: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
                    })
                  }
                />
              </div>
            </div>

            <div className="fsb-field-row">
              <div className="fsb-field-col fsb-col-narrow">
                <label className="fsb-label">Type</label>
                <select
                  className="pi-form-control"
                  value={field.type}
                  onChange={(e) => {
                    const newType = e.target.value as CheckpointFieldType;
                    const patch: Partial<CheckpointFieldDef> = { type: newType };
                    if (TYPES_WITH_OPTIONS.has(newType) && !field.options?.length) {
                      patch.options = [{ value: "option_1", label: "Option 1" }];
                    }
                    updateField(index, patch);
                  }}
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>
                      {ft.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fsb-field-col fsb-col-narrow">
                <label className="fsb-label">Required</label>
                <label className="cp-checkbox-item fsb-checkbox">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                  />
                  <span>Required</span>
                </label>
              </div>
              {field.type === "text" || field.type === "textarea" ? (
                <div className="fsb-field-col">
                  <label className="fsb-label">Placeholder</label>
                  <input
                    type="text"
                    className="pi-form-control"
                    placeholder="Placeholder text..."
                    value={field.placeholder ?? ""}
                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                  />
                </div>
              ) : null}
            </div>

            {TYPES_WITH_MIN_MAX.has(field.type) && (
              <div className="fsb-field-row">
                <div className="fsb-field-col fsb-col-narrow">
                  <label className="fsb-label">Min</label>
                  <input
                    type="number"
                    className="pi-form-control"
                    value={field.min ?? ""}
                    onChange={(e) =>
                      updateField(index, {
                        min: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="fsb-field-col fsb-col-narrow">
                  <label className="fsb-label">Max</label>
                  <input
                    type="number"
                    className="pi-form-control"
                    value={field.max ?? ""}
                    onChange={(e) =>
                      updateField(index, {
                        max: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            )}

            {TYPES_WITH_OPTIONS.has(field.type) && (
              <div className="fsb-options-section">
                <div className="fsb-options-header">
                  <span className="fsb-label">Options</span>
                  <button
                    type="button"
                    className="fsb-add-option-btn"
                    onClick={() => addOption(index)}
                  >
                    + Add option
                  </button>
                </div>
                {(field.options ?? []).map((opt, oi) => (
                  <div key={oi} className="fsb-option-row">
                    <input
                      type="text"
                      className="pi-form-control"
                      placeholder="Value"
                      value={opt.value}
                      onChange={(e) => updateOption(index, oi, "value", e.target.value)}
                    />
                    <input
                      type="text"
                      className="pi-form-control"
                      placeholder="Label"
                      value={opt.label}
                      onChange={(e) => updateOption(index, oi, "label", e.target.value)}
                    />
                    <button
                      type="button"
                      className="fsb-remove-btn fsb-remove-opt"
                      onClick={() => removeOption(index, oi)}
                      title="Remove option"
                    >
                      &#10005;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="fsb-add-field-btn" onClick={addField}>
        + Add field
      </button>
    </div>
  );
}
