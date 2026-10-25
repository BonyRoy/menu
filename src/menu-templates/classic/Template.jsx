import {
  PhoneCall01,
  MarkerPin01,
  Menu01,
  ChevronRight,
  Lightning01,
  FilterLines,
  LayoutGrid01,
  List,
} from "@untitledui/icons";
import { DietDot } from "../../components/menu/MenuParts";
import CustomSelect from "../../components/CustomSelect";
import SectionItems from "../shared/SectionItems";
import MenuDrawer from "../shared/MenuDrawer";
import WhatsAppIcon from "../shared/WhatsAppIcon";

export default function ClassicTemplate({ m }) {
  const {
    restaurant,
    menuEntries,
    cuisine,
    setCuisine,
    dietFilter,
    setDietFilter,
    activeSection,
    mobileNavOpen,
    setMobileNavOpen,
    viewMode,
    setViewMode,
    heroGone,
    menuRef,
    sectionRefs,
    chromeRef,
    controlsRef,
    chipsRef,
    chipRefs,
    sectionNavRef,
    sectionNavLinkRefs,
    brand,
    logoUrl,
    heroImage,
    currency,
    themeVars,
    mapsHref,
    activeMenu,
    filteredSections,
    scrollToMenu,
    scrollToSection,
    callHref,
    whatsappHref,
  } = m;

  return (
    <div className="page menu-tpl menu-tpl--classic" style={themeVars} data-menu-template="classic">
      <div className="grain" aria-hidden="true" />

      <header
        ref={chromeRef}
        className={`chrome ${heroGone ? "chrome--solid" : ""}`}
      >
        <div className="chrome__inner">
          <button
            type="button"
            className="chrome__menu-btn only-phone"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open sections"
          >
            <Menu01 />
          </button>

          <p className="chrome__brand">
            {logoUrl && <img src={logoUrl} alt="" className="chrome__logo" />}
            <span className="chrome__brand-red">{brand.primary}</span>
            {brand.secondary && (
              <>
                <span className="chrome__brand-amp">&</span>
                <span className="chrome__brand-spyyce">{brand.secondary}</span>
              </>
            )}
          </p>

          <a className="chrome__call" href={callHref} aria-label="Call restaurant">
            <PhoneCall01 />
            <span className="only-desk">Call</span>
          </a>
        </div>
      </header>

      <section className="hero" style={{ "--hero-image": `url("${heroImage}")` }}>
        <div className="hero__media" aria-hidden="true">
          <img src={heroImage} alt="" />
          <div className="hero__wash" />
        </div>

        <div className="hero__content">
          <p className="hero__brand animate-rise">
            <span>{brand.primary}</span>
            {brand.secondary && (
              <span className="hero__brand-line">&amp; {brand.secondary}</span>
            )}
          </p>
          <h1 className="hero__tagline animate-rise delay-1">
            {restaurant.tagline || "Your digital menu, beautifully served."}
          </h1>
          <p className="hero__support animate-rise delay-2">
            Browse our full menu below — call or WhatsApp to order.
          </p>
          <div className="hero__cta animate-rise delay-3">
            <button type="button" className="btn btn--primary" onClick={scrollToMenu}>
              View menu
              <ChevronRight />
            </button>
            <a className="btn btn--ghost" href={callHref}>
              <PhoneCall01 />
              {restaurant.phone}
            </a>
          </div>
        </div>
      </section>

      <section className="meta">
        {(restaurant.address || mapsHref) && (
          <div className="meta__item">
            <MarkerPin01 />
            <p>
              {restaurant.address}
              {restaurant.address && mapsHref ? " · " : ""}
              {mapsHref ? (
                <a href={mapsHref} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              ) : null}
            </p>
          </div>
        )}
        {restaurant.tagline && (
          <div className="meta__item">
            <Lightning01 />
            <p>{restaurant.tagline}</p>
          </div>
        )}
      </section>

      <main className="menu" ref={menuRef} id="menu">
        <div className="menu__shell">
          <aside className="menu__sidebar only-desk">
            <div className="cuisine cuisine--rail">
              {menuEntries.map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  className={`cuisine__btn ${cuisine === key ? "is-active" : ""}`}
                  onClick={() => setCuisine(key)}
                >
                  {value.title}
                </button>
              ))}
            </div>

            <div className="diet-filters">
              <p className="diet-filters__label">
                <FilterLines /> Filter
              </p>
              {[
                { id: "all", label: "All" },
                { id: "veg", label: "Veg" },
                { id: "non-veg", label: "Non-veg" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`diet-filters__chip ${dietFilter === f.id ? "is-active" : ""} diet-filters__chip--${f.id}`}
                  onClick={() => setDietFilter(f.id)}
                >
                  {f.id !== "all" && (
                    <DietDot type={f.id === "non-veg" ? "non-veg" : "veg"} />
                  )}
                  {f.label}
                </button>
              ))}
            </div>

            <nav
              className="section-nav"
              aria-label="Menu sections"
              ref={sectionNavRef}
            >
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  ref={(el) => {
                    sectionNavLinkRefs.current[section.id] = el;
                  }}
                  className={`section-nav__link ${activeSection === section.id ? "is-active" : ""}`}
                  onClick={() => scrollToSection(section.id)}
                >
                  <span className={`section-nav__type type--${section.type}`} />
                  {section.name}
                </button>
              ))}
            </nav>
          </aside>

          <div className="menu__main">
            <div className="menu__controls only-phone" ref={controlsRef}>
              <div className="cuisine-select">
                <CustomSelect
                  className="cuisine-select__field"
                  value={cuisine}
                  onChange={setCuisine}
                  options={[
                    { value: "all", label: "Everything" },
                    ...menuEntries.map(([key, value]) => ({
                      value: key,
                      label: value.title,
                    })),
                  ]}
                  placeholder="Select category"
                />
              </div>

              <div className="diet-row">
                {[
                  { id: "all", label: "All" },
                  { id: "veg", label: "Veg" },
                  { id: "non-veg", label: "Non-veg" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`diet-row__chip ${dietFilter === f.id ? "is-active" : ""}`}
                    onClick={() => setDietFilter(f.id)}
                  >
                    {f.id !== "all" && (
                      <DietDot type={f.id === "non-veg" ? "non-veg" : "veg"} />
                    )}
                    {f.label}
                  </button>
                ))}
              </div>

              <div
                className="section-chips"
                role="tablist"
                aria-label="Sections"
                ref={chipsRef}
              >
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    role="tab"
                    ref={(el) => {
                      chipRefs.current[section.id] = el;
                    }}
                    aria-selected={activeSection === section.id}
                    className={`section-chips__chip ${activeSection === section.id ? "is-active" : ""}`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.name
                      .replace(/ IN (INDIAN|CHINESE)/i, "")
                      .replace(/ INDIAN| CHINESE/i, "")}
                  </button>
                ))}
              </div>
            </div>

            <div className="menu__toolbar only-desk">
              <div>
                <h2 className="menu__title">{activeMenu.title} menu</h2>
                <p className="menu__count">
                  {filteredSections.reduce((n, s) => n + s.items.length, 0)}{" "}
                  dishes
                </p>
              </div>
              <div className="view-toggle" role="group" aria-label="Layout">
                <button
                  type="button"
                  className={viewMode === "list" ? "is-active" : ""}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <List />
                </button>
                <button
                  type="button"
                  className={viewMode === "grid" ? "is-active" : ""}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <LayoutGrid01 />
                </button>
              </div>
            </div>

            <div className={`menu__sections menu__sections--${viewMode}`}>
              {filteredSections.map((section, sIdx) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="menu-section"
                  ref={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                  style={{ "--i": sIdx }}
                >
                  <header className="menu-section__head">
                    <h3>
                      <span className={`type-badge type--${section.type}`} />
                      {section.name}
                    </h3>
                    <span className="menu-section__count">
                      {section.items.length}
                    </span>
                  </header>

                  <SectionItems
                    items={section.items}
                    sectionType={section.type}
                    currency={currency}
                    variant="classic"
                  />
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <a href={callHref}>
          <PhoneCall01 /> {restaurant.phone}
        </a>
        {restaurant.address && (
          <p className="footer__addr">
            <MarkerPin01 /> {restaurant.address}
          </p>
        )}
      </footer>

      <MenuDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        sections={filteredSections}
        onSelect={scrollToSection}
      />

      <a
        className="fab"
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
}
