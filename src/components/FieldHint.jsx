export default function FieldHint({ term }) {
  if (!term?.label) return null;

  return (
    <span className="field-hint">
      <span className="field-hint-label">{term.label}</span>
      <span className="field-hint-help" title={term.help}>
        ?
      </span>
      <span className="field-hint-tooltip">{term.help}</span>
    </span>
  );
}
