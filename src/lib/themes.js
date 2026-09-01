export const DEFAULT_THEME = {
  id: "classic-chilli",
  name: "Classic Chilli",
  paper: "#fff7f2",
  paper2: "#ffe8dc",
  ash: "#f0e6df",
  accent: "#c8102e",
  accentDeep: "#8f0c22",
  ember: "#ff3b1f",
};

export const THEME_PRESETS = [
  DEFAULT_THEME,
  {
    id: "soft-rose",
    name: "Soft Rose",
    paper: "#fff5f7",
    paper2: "#ffe4ea",
    ash: "#f3e0e4",
    accent: "#d9486a",
    accentDeep: "#a61e4d",
    ember: "#f06595",
  },
  {
    id: "ember-glow",
    name: "Ember Glow",
    paper: "#fff8f3",
    paper2: "#ffe8d6",
    ash: "#f0e2d6",
    accent: "#e8590c",
    accentDeep: "#c2255c",
    ember: "#ff922b",
  },
  {
    id: "deep-maroon",
    name: "Deep Maroon",
    paper: "#fff6f4",
    paper2: "#fde2e0",
    ash: "#efd9d6",
    accent: "#9b1c1c",
    accentDeep: "#7f1d1d",
    ember: "#dc2626",
  },
  {
    id: "spice-gold",
    name: "Spice Gold",
    paper: "#fffbeb",
    paper2: "#fef3c7",
    ash: "#f5e9c8",
    accent: "#b45309",
    accentDeep: "#92400e",
    ember: "#f59e0b",
  },
  {
    id: "fresh-mint",
    name: "Fresh Mint",
    paper: "#f3faf7",
    paper2: "#d8f3e7",
    ash: "#d5e8df",
    accent: "#0f766e",
    accentDeep: "#115e59",
    ember: "#14b8a6",
  },
  {
    id: "ocean-ink",
    name: "Ocean Ink",
    paper: "#f5f9ff",
    paper2: "#dbeafe",
    ash: "#d7e3f4",
    accent: "#1d4ed8",
    accentDeep: "#1e3a8a",
    ember: "#3b82f6",
  },
  {
    id: "night-plum",
    name: "Night Plum",
    paper: "#faf5ff",
    paper2: "#f3e8ff",
    ash: "#e9ddf3",
    accent: "#7e22ce",
    accentDeep: "#581c87",
    ember: "#a855f7",
  },
];

export function resolveTheme(theme) {
  if (!theme) return DEFAULT_THEME;
  if (typeof theme === "string") {
    return THEME_PRESETS.find((t) => t.id === theme) || DEFAULT_THEME;
  }
  if (theme.id) {
    const preset = THEME_PRESETS.find((t) => t.id === theme.id);
    if (preset) return { ...preset, ...theme };
  }
  return { ...DEFAULT_THEME, ...theme };
}

export function themeToCssVars(themeInput) {
  const theme = resolveTheme(themeInput);
  return {
    "--paper": theme.paper,
    "--paper-2": theme.paper2,
    "--ash": theme.ash,
    "--chilli": theme.accent,
    "--chilli-deep": theme.accentDeep,
    "--ember": theme.ember,
  };
}
