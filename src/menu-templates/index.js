import classic from "./classic";
import noirGold from "./noir-gold";
import photoStory from "./photo-story";
import minimalElegant from "./minimal-elegant";

export const DEFAULT_TEMPLATE = classic;

export const TEMPLATE_PRESETS = [
  classic,
  noirGold,
  photoStory,
  minimalElegant,
];

/** Accepts a template id string, or a restaurant theme object with optional `template`. */
export function resolveTemplate(themeOrId) {
  if (!themeOrId) return DEFAULT_TEMPLATE;

  if (typeof themeOrId === "string") {
    return (
      TEMPLATE_PRESETS.find((t) => t.id === themeOrId) || DEFAULT_TEMPLATE
    );
  }

  if (themeOrId.template) {
    return (
      TEMPLATE_PRESETS.find((t) => t.id === themeOrId.template) ||
      DEFAULT_TEMPLATE
    );
  }

  return DEFAULT_TEMPLATE;
}
