export default function ClassicPreview({ paper = "#fff7f2", accent = "#c8102e" }) {
  return (
    <div className="menu-layout-preview menu-layout-preview--classic" style={{ background: paper }}>
      <div className="menu-layout-preview__hero" style={{ background: accent }} />
      <div className="menu-layout-preview__body">
        <span className="menu-layout-preview__bar" style={{ background: accent }} />
        <span className="menu-layout-preview__line" />
        <span className="menu-layout-preview__line" />
        <span className="menu-layout-preview__line short" />
      </div>
    </div>
  );
}
