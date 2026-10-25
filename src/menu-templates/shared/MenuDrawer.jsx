import { ChevronRight, XClose } from "@untitledui/icons";

export default function MenuDrawer({
  open,
  onClose,
  sections,
  onSelect,
}) {
  return (
    <div className={`drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button
        type="button"
        className="drawer__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="drawer__panel" role="dialog" aria-label="Sections">
        <div className="drawer__head">
          <p>Jump to</p>
          <button type="button" onClick={onClose} aria-label="Close">
            <XClose />
          </button>
        </div>
        <nav>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
            >
              <span className={`type-badge type--${section.type}`} />
              {section.name}
              <ChevronRight />
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
