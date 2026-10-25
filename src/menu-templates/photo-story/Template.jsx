import {
  PhoneCall01,
  MarkerPin01,
  Menu01,
  FilterLines,
} from "@untitledui/icons";
import { DietDot } from "../../components/menu/MenuParts";
import CustomSelect from "../../components/CustomSelect";
import SectionItems from "../shared/SectionItems";
import MenuDrawer from "../shared/MenuDrawer";
import WhatsAppIcon from "../shared/WhatsAppIcon";

export default function PhotoStoryTemplate({ m }) {
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
    scrollToSection,
    callHref,
    whatsappHref,
  } = m;

  return (
    <div
      className="page menu-tpl menu-tpl--photo-story"
      style={themeVars}
      data-menu-template="photo-story"
    >
      <div className="ps-layout">
        <aside className="ps-photo" aria-hidden="true">
          <img src={heroImage} alt="" />
          <div className="ps-photo__shade" />
          <div className="ps-photo__brand">
            {logoUrl && <img src={logoUrl} alt="" className="ps-photo__logo" />}
            <p>
              {brand.primary}
              {brand.secondary ? (
                <span> &amp; {brand.secondary}</span>
              ) : null}
            </p>
          </div>
        </aside>

        <div className="ps-panel">
          <header className="ps-chrome" ref={chromeRef}>
            <button
              type="button"
              className="ps-chrome__menu only-phone"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open sections"
            >
              <Menu01 />
            </button>
            <div className="ps-chrome__title">
              <h1>
                {brand.primary}
                {brand.secondary ? (
                  <span> &amp; {brand.secondary}</span>
                ) : null}
              </h1>
              <p>{restaurant.tagline || "Stories told through flavour."}</p>
            </div>
            <a className="ps-chrome__call" href={callHref} aria-label="Call">
              <PhoneCall01 />
            </a>
          </header>

          <div className="ps-mobile-hero only-phone">
            <img src={heroImage} alt="" />
          </div>

          {(restaurant.address || mapsHref) && (
            <p className="ps-address">
              <MarkerPin01 />
              <span>
                {restaurant.address}
                {mapsHref ? (
                  <>
                    {" · "}
                    <a href={mapsHref} target="_blank" rel="noreferrer">
                      Directions
                    </a>
                  </>
                ) : null}
              </span>
            </p>
          )}

          <main className="ps-menu" ref={menuRef} id="menu">
            <div className="ps-controls" ref={controlsRef}>
              <CustomSelect
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
              <div className="ps-diet">
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
              <div className="ps-chips" ref={chipsRef}>
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

            <p className="ps-menu__label">{activeMenu.title} menu</p>

            {filteredSections.map((section, sIdx) => (
              <section
                key={section.id}
                id={section.id}
                className="ps-section"
                ref={(el) => {
                  sectionRefs.current[section.id] = el;
                }}
                style={{ "--i": sIdx }}
              >
                <header className="ps-section__head">
                  <h2>{section.name}</h2>
                  <span>{section.items.length}</span>
                </header>
                <SectionItems
                  items={section.items}
                  sectionType={section.type}
                  currency={currency}
                  variant="photo"
                />
              </section>
            ))}
          </main>

          <footer className="ps-footer">
            <a href={callHref}>
              <PhoneCall01 /> {restaurant.phone}
            </a>
          </footer>
        </div>
      </div>

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
