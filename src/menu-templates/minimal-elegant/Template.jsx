import {
  PhoneCall01,
  MarkerPin01,
  Menu01,
} from "@untitledui/icons";
import { DietDot } from "../../components/menu/MenuParts";
import CustomSelect from "../../components/CustomSelect";
import SectionItems from "../shared/SectionItems";
import MenuDrawer from "../shared/MenuDrawer";
import WhatsAppIcon from "../shared/WhatsAppIcon";

export default function MinimalElegantTemplate({ m }) {
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
      className="page menu-tpl menu-tpl--minimal"
      style={themeVars}
      data-menu-template="minimal-elegant"
    >
      <div className="me-ornament me-ornament--tl" aria-hidden="true" />
      <div className="me-ornament me-ornament--br" aria-hidden="true" />

      <header className="me-chrome" ref={chromeRef}>
        <button
          type="button"
          className="me-chrome__menu only-phone"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open sections"
        >
          <Menu01 />
        </button>
        <div className="me-chrome__brand">
          {logoUrl && <img src={logoUrl} alt="" />}
          <span>
            {brand.primary}
            {brand.secondary ? ` & ${brand.secondary}` : ""}
          </span>
        </div>
        <a className="me-chrome__call" href={callHref} aria-label="Call">
          <PhoneCall01 />
        </a>
      </header>

      <header className="me-masthead">
        <div className="me-masthead__photo">
          <img src={heroImage} alt="" />
        </div>
        <p className="me-masthead__eyebrow">Menu</p>
        <h1>
          {brand.primary}
          {brand.secondary ? (
            <em> &amp; {brand.secondary}</em>
          ) : null}
        </h1>
        <p className="me-masthead__tag">
          {restaurant.tagline || "Simple plates. Quiet elegance."}
        </p>
        {(restaurant.address || mapsHref) && (
          <p className="me-masthead__addr">
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
      </header>

      <main className="me-menu" ref={menuRef} id="menu">
        <div className="me-controls" ref={controlsRef}>
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
          <div className="me-diet">
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
          <div className="me-chips" ref={chipsRef}>
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

        <p className="me-menu__kicker">{activeMenu.title}</p>

        {filteredSections.map((section, sIdx) => (
          <section
            key={section.id}
            id={section.id}
            className="me-section"
            ref={(el) => {
              sectionRefs.current[section.id] = el;
            }}
            style={{ "--i": sIdx }}
          >
            <h2>{section.name}</h2>
            <SectionItems
              items={section.items}
              sectionType={section.type}
              currency={currency}
              variant="minimal"
            />
          </section>
        ))}
      </main>

      <footer className="me-footer">
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
        className="fab fab--minimal"
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
