import { useEffect, useMemo, useRef, useState } from "react";
import { parseBrandName, resolveItemType, getMenuEntries, getMenuByKey } from "../components/menu/menuUtils";
import { DEFAULT_HERO_IMAGE } from "../lib/supabase";
import { themeToCssVars } from "../lib/themes";

export function usePublicMenu(restaurant, menus) {
  const menuEntries = useMemo(() => getMenuEntries(menus), [menus]);
  const allMenu = useMemo(
    () => ({
      title: "All",
      sections: menuEntries.flatMap(([, menu]) => menu.sections || []),
    }),
    [menuEntries],
  );
  const [cuisine, setCuisine] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 899px)").matches
        ? "all"
        : getMenuEntries(menus)[0]?.[0] || "indian",
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
  const logoUrl = restaurant.logo_url;
  const customHero =
    restaurant.hero_image_url &&
    restaurant.hero_image_url !== DEFAULT_HERO_IMAGE
      ? restaurant.hero_image_url
      : null;
  const heroImage = customHero || logoUrl || DEFAULT_HERO_IMAGE;
  const currency = restaurant.currency || "INR";
  const themeVars = themeToCssVars(restaurant.theme);
  const mapsHref =
    restaurant.venue?.lat && restaurant.venue?.lng
      ? `https://www.google.com/maps?q=${encodeURIComponent(
          `${restaurant.venue.lat},${restaurant.venue.lng}`,
        )}`
      : null;

  const activeMenu =
    cuisine === "all"
      ? allMenu
      : getMenuByKey(menus, cuisine) || menuEntries[0]?.[1];

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
      `${getStickyOffset()}px`,
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
    if (
      menuEntries.length &&
      cuisine !== "all" &&
      !getMenuByKey(menus, cuisine)
    ) {
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
        { rootMargin: `-${top + 8}px 0px -55% 0px`, threshold: 0 },
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
  const whatsappNumber = restaurant.whatsapp || restaurant.phone;
  const whatsappHref = `https://wa.me/91${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hello! I'd like to place an order or enquire about catering.",
  )}`;

  return {
    restaurant,
    menus,
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
  };
}
