import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "@untitledui/icons";

export default function CustomSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select…",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <label
      className={`auth-field custom-select ${open ? "is-open" : ""} ${className}`.trim()}
    >
      {label ? <span>{label}</span> : null}
      <div className="custom-select__root" ref={rootRef}>
        <button
          type="button"
          className="custom-select__trigger"
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
        >
          <span className={selected ? "" : "custom-select__placeholder"}>
            {selected?.label || placeholder}
          </span>
          <ChevronDown />
        </button>

        {open && (
          <ul id={listId} className="custom-select__menu" role="listbox">
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <li key={opt.value} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    className={`custom-select__option ${isActive ? "is-active" : ""}`}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {isActive ? <span className="custom-select__check">✓</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </label>
  );
}
