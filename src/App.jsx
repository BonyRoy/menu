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
  MessageChatCircle,
} from "@untitledui/icons";
import menuData from "./data/menu.json";
import "./App.scss";

const { restaurant, menus } = menuData;

function formatPrice(value) {
  return `₹${value}`;
}

function ItemPrice({ item }) {
  if (item.priceHalf != null && item.priceFull != null) {
    return (
      <span className="price price--split">
        <span>
          <small>H</small> {formatPrice(item.priceHalf)}
        </span>
        <span className="price__sep">·</span>
        <span>
          <small>F</small> {formatPrice(item.priceFull)}
        </span>
      </span>
    );
  }
  return <span className="price">{formatPrice(item.price)}</span>;
}

function DietDot({ type }) {
  const label =
    type === "veg"
      ? "Veg"
      : type === "egg"
        ? "Egg"
        : type === "non-veg"
          ? "Non-veg"
          : "";
  if (!label) return null;
  return (
    <span className={`diet diet--${type}`} title={label} aria-label={label}>
      <span className="diet__dot" />
    </span>
  );
}

function resolveItemType(item, sectionType) {
  return item.type || (sectionType === "mixed" ? "veg" : sectionType);
}

const App = () => {
  const [cuisine, setCuisine] = useState("indian");
  const [dietFilter, setDietFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [heroGone, setHeroGone] = useState(false);
  const menuRef = useRef(null);
  const sectionRefs = useRef({});
  const chromeRef = useRef(null);
  const controlsRef = useRef(null);

  const activeMenu = menus[cuisine];

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

  const scrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToSection = (id) => {
    setMobileNavOpen(false);
    const el = sectionRefs.current[id];
    if (!el) return;
    // Wait a tick so drawer close / layout settle, then measure sticky stack
    requestAnimationFrame(() => {
      syncScrollMargin();
      const offset = getStickyOffset();
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  };

  const callHref = `tel:${restaurant.phone}`;
  const whatsappHref = `https://wa.me/91${restaurant.phone.replace(/\D/g, "")}`;

  return (
    <div className="page">
      <div className="grain" aria-hidden="true" />

      {/* —— Sticky chrome —— */}
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
            <span className="chrome__brand-red">Red Chilli</span>
            <span className="chrome__brand-amp">&</span>
            <span className="chrome__brand-spyyce">Spyyce</span>
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

      {/* —— Hero —— */}
      <section className="hero">
        <div className="hero__media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1920&q=80"
            alt=""
          />
          <div className="hero__wash" />
        </div>

        <div className="hero__content">
          <p className="hero__brand animate-rise">
            <span>Red Chilli</span>
            <span className="hero__brand-line">&amp; Spyyce</span>
          </p>
          <h1 className="hero__tagline animate-rise delay-1">
            Catering that hits every occasion.
          </h1>
          <p className="hero__support animate-rise delay-2">
            Indian &amp; Chinese · Bulk orders for birthdays, kiti-parties,
            society functions &amp; more.
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

      {/* —— Meta strip (below fold on purpose) —— */}
      <section className="meta">
        <div className="meta__item">
          <MarkerPin01 />
          <p>{restaurant.address}</p>
        </div>
        <div className="meta__item">
          <Lightning01 />
          <p>{restaurant.tagline}</p>
        </div>
      </section>

      {/* —— Menu —— */}
      <main className="menu" ref={menuRef} id="menu">
        <div className="menu__shell">
          {/* Desktop sidebar */}
          <aside className="menu__sidebar only-desk">
            <div className="cuisine cuisine--rail">
              {Object.entries(menus).map(([key, value]) => (
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

            <nav className="section-nav" aria-label="Menu sections">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
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
            {/* Phone: sticky controls */}
            <div className="menu__controls only-phone" ref={controlsRef}>
              <div className="cuisine cuisine--pills">
                {Object.entries(menus).map(([key, value]) => (
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
              >
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    role="tab"
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

            {/* Desktop toolbar */}
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
                            <ItemPrice item={item} />
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
        <p className="footer__addr">
          <MarkerPin01 /> {restaurant.address}
        </p>
      </footer>

      {/* Phone drawer */}
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

      {/* Phone floating call */}
      <a
        className="fab only-phone"
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <MessageChatCircle />
      </a>
    </div>
  );
};

export default App;
