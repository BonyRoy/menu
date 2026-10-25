export default function PhotoStoryPreview({ accent = "#c8102e" }) {
  return (
    <div className="menu-layout-preview menu-layout-preview--photo">
      <div className="menu-layout-preview__photo-col" style={{ background: accent }} />
      <div className="menu-layout-preview__list-col">
        <span className="menu-layout-preview__line" />
        <span className="menu-layout-preview__line" />
        <span className="menu-layout-preview__line short" />
        <span className="menu-layout-preview__line" />
      </div>
    </div>
  );
}
