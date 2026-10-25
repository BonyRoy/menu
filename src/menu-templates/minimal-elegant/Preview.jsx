export default function MinimalElegantPreview({ paper = "#fff7f2" }) {
  return (
    <div
      className="menu-layout-preview menu-layout-preview--minimal"
      style={{ background: paper }}
    >
      <span className="menu-layout-preview__leaf tl" />
      <span className="menu-layout-preview__leaf br" />
      <span className="menu-layout-preview__serif">Menu</span>
      <span className="menu-layout-preview__line center" />
      <span className="menu-layout-preview__line center short" />
      <span className="menu-layout-preview__line center" />
    </div>
  );
}
