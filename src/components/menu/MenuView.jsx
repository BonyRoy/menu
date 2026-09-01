import { useEffect, useMemo, useRef, useState } from "react";
import {
  PhoneCall01,
  MarkerPin01,
  Menu01,
  XClose,
  ChevronRight,
  CurrencyRupee,
  Lightning01,
  Heart,
  Zap,
  FilterLines,
  LayoutGrid01,
  List,
} from "@untitledui/icons";
import { ItemPrice, DietDot } from "./MenuParts";
import { parseBrandName, resolveItemType, getMenuEntries, getMenuByKey } from "./menuUtils";
import CustomSelect from "../CustomSelect";
import { DEFAULT_HERO_IMAGE } from "../../lib/supabase";
import { themeToCssVars } from "../../lib/themes";
import "../../App.scss";
import "../../styles/platform.scss";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.93.52 3.76 1.43 5.34L2 22l4.99-1.3a9.9 9.9 0 0 0 5.05 1.36h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.76 13.98c-.24.68-1.4 1.25-1.93 1.33-.5.08-1.13.11-1.82-.11-.42-.14-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.14-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.45.27-.29.59-.36.79-.36h.57c.18 0 .43-.07.67.51.24.6.82 2.07.89 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.14.17-.3.39-.43.52-.14.15-.29.31-.12.6.16.3.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.27 1.4.3.14.47.12.64-.07.18-.2.74-.86.94-1.16.2-.3.4-.24.67-.14.27.1 1.72.81 2.01.96.3.15.49.22.56.34.08.13.08.74-.16 1.42Z" />
    </svg>
  );
}

export default function MenuView({ restaurant, menus }) {
  const menuEntries = useMemo(() => getMenuEntries(menus), [menus]);
  const [cuisine, setCuisine] = useState(
    () => getMenuEntries(menus)[0]?.[0] || "indian",
  );
  const [dietFilter, setDietFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [heroGone, setHeroGone] = useState(false);
  const menuRef = useRef(null);
  const sectionRefs = useRef({});
  const chromeRef = useRef(null);
  const controlsRef = useRef(null);
  const chipsRef = useRef(null);
  const chipRefs = useRef({});
  const sectionNavRef = useRef(null);
  const sectionNavLinkRefs = useRef({});

  const brand = parseBrandName(restaurant.name);
  const heroImage = restaurant.hero_image_url || DEFAULT_HERO_IMAGE;
  const logoUrl = restaurant.logo_url;
  const currency = restaurant.currency || "INR";
  const themeVars = themeToCssVars(restaurant.theme);

  const activeMenu = getMenuByKey(menus, cuisine) || menuEntries[0]?.[1];

  const getStickyOffset = () => {
    const chromeH = chromeRef.current?.offsetHeight ?? 56;
    const controls = controlsRef.current;
    const controlsVisible =
      controls && window.getComputedStyle(controls).display !== "none";
    const controlsH = controlsVisible ? controls.offsetHeight : 0;
    return chromeH + controlsH + 12;
  };

  const syncScrollMargin = () => {
    document.documentElement.style.setProperty(
      "--scroll-offset",
      `${getStickyOffset()}px`
    );
  };

  const filteredSections = useMemo(() => {
    if (!activeMenu?.sections) return [];
    return activeMenu.sections
      .map((section) => {
        if (dietFilter === "all") return section;
        if (section.type === "mixed") {
          const items = section.items.filter((item) => {
            const t = resolveItemType(item, section.type);
            if (dietFilter === "veg") return t === "veg";
            if (dietFilter === "non-veg") return t === "non-veg" || t === "egg";
            return true;
          });
          return items.length ? { ...section, items } : null;
        }
        if (dietFilter === "veg" && section.type !== "veg") return null;
        if (dietFilter === "non-veg" && section.type === "veg") return null;
        return section;
      })
      .filter(Boolean);
  }, [activeMenu, dietFilter]);

  useEffect(() => {
    if (menuEntries.length && !getMenuByKey(menus, cuisine)) {
      setCuisine(menuEntries[0][0]);
    }
  }, [menus, cuisine, menuEntries]);

  useEffect(() => {
    if (filteredSections.length) {
      setActiveSection(filteredSections[0].id);
    }
  }, [cuisine, dietFilter, filteredSections]);

  useEffect(() => {
    const onScroll = () => setHeroGone(window.scrollY > 120);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    syncScrollMargin();
    const onResize = () => syncScrollMargin();
    window.addEventListener("resize", onResize);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(syncScrollMargin)
        : null;
    if (controlsRef.current) ro?.observe(controlsRef.current);
    if (chromeRef.current) ro?.observe(chromeRef.current);
    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, [cuisine, dietFilter, filteredSections]);

  useEffect(() => {
    const observers = [];
    filteredSections.forEach((section) => {
      const el = sectionRefs.current[section.id];
      if (!el) return;
      const top = getStickyOffset();
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(section.id);
        },
        { rootMargin: `-${top + 8}px 0px -55% 0px`, threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [filteredSections]);

  useEffect(() => {
    if (!activeSection) return;

    const container = chipsRef.current;
    const chip = chipRefs.current[activeSection];
    if (container && chip) {
      const left =
        chip.offsetLeft - container.clientWidth / 2 + chip.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }

    const nav = sectionNavRef.current;
    const navLink = sectionNavLinkRefs.current[activeSection];
    if (nav && navLink) {
      const top =
        navLink.offsetTop - nav.clientHeight / 2 + navLink.offsetHeight / 2;
      nav.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }, [activeSection]);

  const scrollToMenu = () => {
    const el = menuRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const chromeH = chromeRef.current?.offsetHeight ?? 56;
      const top = el.getBoundingClientRect().top + window.scrollY - chromeH - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  };

  const scrollToSection = (id) => {
    setMobileNavOpen(false);
    const el = sectionRefs.current[id];
    if (!el) return;
    requestAnimationFrame(() => {
      syncScrollMargin();
      const offset = getStickyOffset();
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  };

  const callHref = `tel:${restaurant.phone}`;
  const whatsappHref = `https://wa.me/91${restaurant.phone.replace(/\D/g, "")}`;

  if (!activeMenu) {
    return (
      <div className="page">
        <div className="menu-empty">
          <p>No menu data available for this restaurant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={themeVars}>
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
            {logoUrl && (
              <img src={logoUrl} alt="" className="chrome__logo" />
            )}
            <span className="chrome__brand-red">{brand.primary}</span>
            {brand.secondary && (
              <>
                <span className="chrome__brand-amp">&</span>
                <span className="chrome__brand-spyyce">{brand.secondary}</span>
              </>
            )}
          </p>

          <a
            className="chrome__call"
            href={callHref}
            aria-label="Call restaurant"
          >
            <PhoneCall01 />
            <span className="only-desk">Call</span>
          </a>
        </div>
      </header>

      <section className="hero">
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
            <button
              type="button"
              className="btn btn--primary"
              onClick={scrollToMenu}
            >
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
        {restaurant.address && (
          <div className="meta__item">
            <MarkerPin01 />
            <p>{restaurant.address}</p>
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
                  options={menuEntries.map(([key, value]) => ({
                    value: key,
                    label: value.title,
                  }))}
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

                  <ul className="item-list">
                    {section.items.map((item) => {
                      const type = resolveItemType(item, section.type);
                      return (
                        <li key={item.name} className="item">
                          <div className="item__left">
                            <DietDot type={type} />
                            <div>
                              <p className="item__name">{item.name}</p>
                              {item.description && (
                                <p className="item__desc">{item.description}</p>
                              )}
                              {(item.baseOptions || item.curryOptions) && (
                                <div className="item__opts">
                                  {item.baseOptions && (
                                    <p>
                                      <Zap /> {item.baseOptions.join(" · ")}
                                    </p>
                                  )}
                                  {item.curryOptions && (
                                    <p>
                                      <Heart /> {item.curryOptions.join(" · ")}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="item__right">
                            <CurrencyRupee className="item__rupee only-desk" />
                            <ItemPrice item={item} currency={currency} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
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

      <div
        className={`drawer ${mobileNavOpen ? "is-open" : ""}`}
        aria-hidden={!mobileNavOpen}
      >
        <button
          type="button"
          className="drawer__backdrop"
          aria-label="Close"
          onClick={() => setMobileNavOpen(false)}
        />
        <div className="drawer__panel" role="dialog" aria-label="Sections">
          <div className="drawer__head">
            <p>Jump to</p>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close"
            >
              <XClose />
            </button>
          </div>
          <nav>
            {filteredSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
              >
                <span className={`type-badge type--${section.type}`} />
                {section.name}
                <ChevronRight />
              </button>
            ))}
          </nav>
        </div>
      </div>

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
