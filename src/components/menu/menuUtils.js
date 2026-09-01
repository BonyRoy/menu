export function formatPrice(value, currency = "INR") {
  if (currency === "INR") return `₹${value}`;
  return `${currency} ${value}`;
}

export function parseBrandName(name) {
  const parts = name.split(/\s*&\s*/);
  if (parts.length >= 2) {
    return { primary: parts[0].trim(), secondary: parts.slice(1).join(" & ").trim() };
  }
  return { primary: name, secondary: null };
}

export function resolveItemType(item, sectionType) {
  return item.type || (sectionType === "mixed" ? "veg" : sectionType);
}

/** Ordered [key, menu] pairs — supports array (new) and object (legacy) menu_data. */
export function getMenuEntries(menus) {
  if (!menus) return [];
  if (Array.isArray(menus)) {
    return menus
      .filter((m) => m && m.key)
      .map((m) => [m.key, m]);
  }
  return Object.entries(menus);
}

export function getMenuByKey(menus, key) {
  if (!menus || !key) return null;
  if (Array.isArray(menus)) {
    return menus.find((m) => m.key === key) || null;
  }
  return menus[key] || null;
}
