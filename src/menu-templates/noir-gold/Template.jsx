import {
  PhoneCall01,
  MarkerPin01,
  Menu01,
  ChevronRight,
  FilterLines,
} from "@untitledui/icons";
import { DietDot } from "../../components/menu/MenuParts";
import CustomSelect from "../../components/CustomSelect";
import SectionItems from "../shared/SectionItems";
import MenuDrawer from "../shared/MenuDrawer";
import WhatsAppIcon from "../shared/WhatsAppIcon";

export default function NoirGoldTemplate({ m }) {
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
    heroGone,
    menuRef,
    sectionRefs,
    chromeRef,
    controlsRef,
    chipsRef,
    chipRefs,
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
    <div
      className="page menu-tpl menu-tpl--noir-gold"
      style={themeVars}
      data-menu-template="noir-gold"
    >
      <header
        ref={chromeRef}
        className={`ng-chrome ${heroGone ? "is-solid" : ""}`}
      >
        <button
          type="button"
          className="ng-chrome__menu only-phone"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open sections"
        >
          <Menu01 />
        </button>
        <p className="ng-chrome__brand">
          {logoUrl && <img src={logoUrl} alt="" />}
          <span>{brand.primary}{brand.secondary ? ` & ${brand.secondary}` : ""}</span>
        </p>
        <a className="ng-chrome__call" href={callHref} aria-label="Call">
          <PhoneCall01 />
        </a>
      </header>

      <section className="ng-hero">
        <div className="ng-hero__frame">
          <img src={heroImage} alt="" />
          <div className="ng-hero__veil" />
          <div className="ng-hero__copy">
            <p className="ng-hero__eyebrow">Fine dining menu</p>
            <h1>
              {brand.primary}
              {brand.secondary ? (
                <span> &amp; {brand.secondary}</span>
              ) : null}
            </h1>
            <p className="ng-hero__tag">
              {restaurant.tagline || "An evening of flavour, framed in gold."}
            </p>
            <button type="button" className="ng-hero__cta" onClick={scrollToMenu}>
              Explore menu <ChevronRight />
            </button>
          </div>
        </div>
      </section>

      {(restaurant.address || mapsHref) && (
        <p className="ng-meta">
          <MarkerPin01 />
          <span>
            {restaurant.address}
            {mapsHref ? (
              <>
                {" · "}
                <a href={mapsHref} target="_blank" rel="noreferrer">
                  Map
                </a>
              </>
            ) : null}
          </span>
        </p>
      )}

      <main className="ng-menu" ref={menuRef} id="menu">
        <div className="ng-menu__frame">
          <div className="ng-menu__controls" ref={controlsRef}>
            <div className="ng-cuisine">
              <CustomSelect
                className="ng-cuisine__select"
                value={cuisine}
                onChange={setCuisine}
                options={[
                  { value: "all", label: "Everything" },
                  ...menuEntries.map(([key, value]) => ({
                    value: key,
                    label: value.title,
                  })),
                ]}
                placeholder="Cuisine"
              />
            </div>
            <div className="ng-diet">
              <FilterLines />
              {[
                { id: "all", label: "All" },
                { id: "veg", label: "Veg" },
                { id: "non-veg", label: "Non-veg" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={dietFilter === f.id ? "is-active" : ""}
                  onClick={() => setDietFilter(f.id)}
                >
                  {f.id !== "all" && (
                    <DietDot type={f.id === "non-veg" ? "non-veg" : "veg"} />
                  )}
                  {f.label}
                </button>
              ))}
            </div>
            <div className="ng-chips only-phone" ref={chipsRef}>
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  ref={(el) => {
                    chipRefs.current[section.id] = el;
                  }}
                  className={activeSection === section.id ? "is-active" : ""}
                  onClick={() => scrollToSection(section.id)}
                >
                  {section.name
                    .replace(/ IN (INDIAN|CHINESE)/i, "")
                    .replace(/ INDIAN| CHINESE/i, "")}
                </button>
              ))}
            </div>
          </div>

          <header className="ng-menu__head">
            <h2>{activeMenu.title}</h2>
            <span>
              {filteredSections.reduce((n, s) => n + s.items.length, 0)} dishes
            </span>
          </header>

          {filteredSections.map((section, sIdx) => (
            <section
              key={section.id}
              id={section.id}
              className="ng-section"
              ref={(el) => {
                sectionRefs.current[section.id] = el;
              }}
              style={{ "--i": sIdx }}
            >
              <div className="ng-section__bar">
                <h3>{section.name}</h3>
                <span>{section.items.length}</span>
              </div>
              <SectionItems
                items={section.items}
                sectionType={section.type}
                currency={currency}
                variant="noir"
              />
            </section>
          ))}
        </div>
      </main>

      <footer className="ng-footer">
        <a href={callHref}>
          <PhoneCall01 /> {restaurant.phone}
        </a>
      </footer>

      <MenuDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        sections={filteredSections}
        onSelect={scrollToSection}
      />

      <a
        className="fab fab--noir"
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
