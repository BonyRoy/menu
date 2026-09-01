export default function Spinner({ size = "md", label = "Loading…", className = "" }) {
  return (
    <div
      className={`spinner spinner--${size} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className="spinner__ring" aria-hidden="true" />
      {label ? <span className="spinner__label">{label}</span> : null}
    </div>
  );
}

export function SpinnerButton({ loading, children }) {
  return (
    <>
      {loading ? <span className="spinner spinner--btn" aria-hidden="true" /> : null}
      <span>{children}</span>
    </>
  );
}
