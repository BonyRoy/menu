import { Plus, Trash01, ChevronUp, ChevronDown } from "@untitledui/icons";
import CustomSelect from "./CustomSelect";

const SECTION_TYPE_OPTIONS = [
  { value: "veg", label: "Veg" },
  { value: "non-veg", label: "Non-veg" },
  { value: "mixed", label: "Both (mixed)" },
];

const DISH_TYPE_OPTIONS = [
  { value: "veg", label: "Veg" },
  { value: "non-veg", label: "Non-veg" },
  { value: "egg", label: "Egg" },
];

const PRICING_OPTIONS = [
  { value: "single", label: "Single price" },
  { value: "half-full", label: "Half / Full" },
];

function slugify(text) {
  return (
    String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `item-${Date.now()}`
  );
}

function emptyItem() {
  return {
    name: "",
    pricing: "single",
    price: "",
    priceHalf: "",
    priceFull: "",
    itemType: "veg",
    description: "",
    hasOptions: false,
    baseOptions: "",
    curryOptions: "",
  };
}

function emptySection() {
  return {
    id: `section-${Date.now()}`,
    name: "",
    type: "veg",
    items: [emptyItem()],
  };
}

function emptyCuisine() {
  return {
    key: `cuisine-${Date.now()}`,
    title: "",
    sections: [emptySection()],
  };
}

export function menusToBuilder(menus) {
  if (!menus || (typeof menus !== "object" && !Array.isArray(menus))) {
    return [emptyCuisine()];
  }

  const entries = Array.isArray(menus)
    ? menus.filter((m) => m && m.key).map((m) => [m.key, m])
    : Object.entries(menus);

  const list = entries.map(([key, menu]) => ({
    key,
    title: menu?.title || key,
    sections: (menu?.sections || []).map((section) => ({
      id: section.id || slugify(section.name),
      name: section.name || "",
      type: section.type || "veg",
      items: (section.items || []).map((item) => {
        const hasHalfFull =
          item.priceHalf != null && item.priceFull != null;
        return {
          name: item.name || "",
          pricing: hasHalfFull ? "half-full" : "single",
          price: item.price != null ? String(item.price) : "",
          priceHalf: item.priceHalf != null ? String(item.priceHalf) : "",
          priceFull: item.priceFull != null ? String(item.priceFull) : "",
          itemType: item.type || "veg",
          description: item.description || "",
          hasOptions: Boolean(item.baseOptions || item.curryOptions),
          baseOptions: Array.isArray(item.baseOptions)
            ? item.baseOptions.join(", ")
            : "",
          curryOptions: Array.isArray(item.curryOptions)
            ? item.curryOptions.join(", ")
            : "",
        };
      }),
    })),
  }));

  return list.length ? list : [emptyCuisine()];
}

export function builderToMenus(cuisines) {
  const usedKeys = new Set();
  const menus = [];

  cuisines.forEach((cuisine, index) => {
    const title = cuisine.title.trim() || `Menu ${index + 1}`;
    let key = slugify(title);
    if (!key || usedKeys.has(key)) {
      key = `${slugify(cuisine.key) || key || "menu"}-${index + 1}`;
    }
    usedKeys.add(key);

    const sections = (cuisine.sections || [])
      .filter((s) => s.name.trim())
      .map((section) => {
        const sectionId =
          section.id?.trim() || slugify(`${section.name}-${key}`);
        return {
          id: sectionId,
          name: section.name.trim(),
          type: section.type || "veg",
          items: (section.items || [])
            .filter((item) => item.name.trim())
            .map((item) => {
              const out = { name: item.name.trim() };

              if (item.pricing === "half-full") {
                out.priceHalf = Number(item.priceHalf) || 0;
                out.priceFull = Number(item.priceFull) || 0;
              } else {
                out.price = Number(item.price) || 0;
              }

              if (section.type === "mixed" && item.itemType) {
                out.type = item.itemType;
              }

              if (item.description?.trim()) {
                out.description = item.description.trim();
              }

              if (item.hasOptions) {
                const base = item.baseOptions
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                const curry = item.curryOptions
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (base.length) out.baseOptions = base;
                if (curry.length) out.curryOptions = curry;
              }

              return out;
            }),
        };
      })
      .filter((s) => s.items.length > 0);

    menus.push({ key, title, sections });
  });

  return menus;
}

export function validateBuilder(cuisines) {
  if (!cuisines.length) return "Add at least one menu category.";

  for (const cuisine of cuisines) {
    if (!cuisine.title.trim()) return "Each menu category needs a name.";
    const sections = cuisine.sections || [];
    if (!sections.some((s) => s.name.trim())) {
      return `Add at least one section under “${cuisine.title || "a category"}”.`;
    }
    for (const section of sections) {
      if (!section.name.trim()) continue;
      const items = (section.items || []).filter((i) => i.name.trim());
      if (!items.length) {
        return `Section “${section.name}” needs at least one dish.`;
      }
      for (const item of items) {
        if (item.pricing === "half-full") {
          if (item.priceHalf === "" || item.priceFull === "") {
            return `Add half & full prices for “${item.name}”.`;
          }
        } else if (item.price === "") {
          return `Add a price for “${item.name}”.`;
        }
      }
    }
  }

  const menus = builderToMenus(cuisines);
  if (!menus.length || !menus.some((m) => m.sections?.length)) {
    return "Add at least one dish to your menu.";
  }
  return null;
}

export default function MenuBuilder({ value, onChange, disabled, searchQuery = "" }) {
  const update = (next) => onChange(next);

  const updateCuisine = (cIdx, patch) => {
    update(
      value.map((c, i) => (i === cIdx ? { ...c, ...patch } : c))
    );
  };

  const updateSection = (cIdx, sIdx, patch) => {
    update(
      value.map((c, i) => {
        if (i !== cIdx) return c;
        return {
          ...c,
          sections: c.sections.map((s, j) =>
            j === sIdx ? { ...s, ...patch } : s
          ),
        };
      })
    );
  };

  const updateItem = (cIdx, sIdx, iIdx, patch) => {
    update(
      value.map((c, i) => {
        if (i !== cIdx) return c;
        return {
          ...c,
          sections: c.sections.map((s, j) => {
            if (j !== sIdx) return s;
            return {
              ...s,
              items: s.items.map((item, k) =>
                k === iIdx ? { ...item, ...patch } : item
              ),
            };
          }),
        };
      })
    );
  };

  const addCuisine = () => update([...value, emptyCuisine()]);
  const removeCuisine = (cIdx) => {
    if (value.length <= 1) return;
    update(value.filter((_, i) => i !== cIdx));
  };

  const moveCuisine = (cIdx, direction) => {
    const target = cIdx + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[cIdx], next[target]] = [next[target], next[cIdx]];
    update(next);
  };

  const addSection = (cIdx) => {
    update(
      value.map((c, i) =>
        i === cIdx ? { ...c, sections: [...c.sections, emptySection()] } : c
      )
    );
  };

  const removeSection = (cIdx, sIdx) => {
    update(
      value.map((c, i) => {
        if (i !== cIdx) return c;
        const sections = c.sections.filter((_, j) => j !== sIdx);
        return { ...c, sections: sections.length ? sections : [emptySection()] };
      })
    );
  };

  const moveSection = (cIdx, sIdx, direction) => {
    const sections = value[cIdx]?.sections || [];
    const target = sIdx + direction;
    if (target < 0 || target >= sections.length) return;
    update(
      value.map((c, i) => {
        if (i !== cIdx) return c;
        const nextSections = [...c.sections];
        [nextSections[sIdx], nextSections[target]] = [
          nextSections[target],
          nextSections[sIdx],
        ];
        return { ...c, sections: nextSections };
      })
    );
  };

  const moveItem = (cIdx, sIdx, iIdx, direction) => {
    const items = value[cIdx]?.sections?.[sIdx]?.items || [];
    const target = iIdx + direction;
    if (target < 0 || target >= items.length) return;
    update(
      value.map((c, i) => {
        if (i !== cIdx) return c;
        return {
          ...c,
          sections: c.sections.map((s, j) => {
            if (j !== sIdx) return s;
            const nextItems = [...s.items];
            [nextItems[iIdx], nextItems[target]] = [
              nextItems[target],
              nextItems[iIdx],
            ];
            return { ...s, items: nextItems };
          }),
        };
      })
    );
  };

  const addItem = (cIdx, sIdx) => {
    update(
      value.map((c, i) => {
        if (i !== cIdx) return c;
        return {
          ...c,
          sections: c.sections.map((s, j) =>
            j === sIdx ? { ...s, items: [...s.items, emptyItem()] } : s
          ),
        };
      })
    );
  };

  const removeItem = (cIdx, sIdx, iIdx) => {
    update(
      value.map((c, i) => {
        if (i !== cIdx) return c;
        return {
          ...c,
          sections: c.sections.map((s, j) => {
            if (j !== sIdx) return s;
            const items = s.items.filter((_, k) => k !== iIdx);
            return { ...s, items: items.length ? items : [emptyItem()] };
          }),
        };
      })
    );
  };

  const q = searchQuery.trim().toLowerCase();
  const matches = (text) => !q || String(text || "").toLowerCase().includes(q);

  const cuisineVisible = (cuisine) =>
    matches(cuisine.title) ||
    cuisine.sections.some(
      (section) =>
        matches(section.name) ||
        section.items.some(
          (item) => matches(item.name) || matches(item.description)
        )
    );

  const sectionVisible = (section, cuisineMatched) =>
    cuisineMatched ||
    matches(section.name) ||
    section.items.some(
      (item) => matches(item.name) || matches(item.description)
    );

  const itemVisible = (item, parentMatched) =>
    parentMatched || matches(item.name) || matches(item.description);

  const anyVisible = !q || value.some(cuisineVisible);

  return (
    <div className="menu-builder">
      {q && !anyVisible && (
        <p className="menu-builder__empty-search">
          No dishes match “{searchQuery.trim()}”.
        </p>
      )}
      {value.map((cuisine, cIdx) => {
        if (!cuisineVisible(cuisine)) return null;
        const cuisineMatched = matches(cuisine.title);

        return (
        <div key={cuisine.key} className="menu-builder__cuisine">
          <div className="menu-builder__cuisine-head">
            <label className="auth-field menu-builder__grow">
              <span>Menu category name</span>
              <input
                value={cuisine.title}
                onChange={(e) => updateCuisine(cIdx, { title: e.target.value })}
                placeholder="e.g. Indian, Chinese, Continental"
                disabled={disabled}
              />
            </label>
            <div className="menu-builder__move" role="group" aria-label="Reorder category">
              <button
                type="button"
                className="menu-builder__move-btn"
                onClick={() => moveCuisine(cIdx, -1)}
                disabled={disabled || cIdx === 0}
                aria-label="Move category up"
                title="Move category up"
              >
                <ChevronUp />
              </button>
              <button
                type="button"
                className="menu-builder__move-btn"
                onClick={() => moveCuisine(cIdx, 1)}
                disabled={disabled || cIdx === value.length - 1}
                aria-label="Move category down"
                title="Move category down"
              >
                <ChevronDown />
              </button>
            </div>
            {value.length > 1 && (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => removeCuisine(cIdx)}
                disabled={disabled}
              >
                <Trash01 />
                Remove
              </button>
            )}
          </div>

          {cuisine.sections.map((section, sIdx) => {
            if (!sectionVisible(section, cuisineMatched)) return null;
            const sectionMatched = cuisineMatched || matches(section.name);

            return (
            <div key={section.id} className="menu-builder__section">
              <div className="menu-builder__section-head">
                <label className="auth-field menu-builder__grow">
                  <span>Section name</span>
                  <input
                    value={section.name}
                    onChange={(e) =>
                      updateSection(cIdx, sIdx, { name: e.target.value })
                    }
                    placeholder="e.g. Veg Starters"
                    disabled={disabled}
                  />
                </label>

                <CustomSelect
                  label="Type"
                  value={section.type}
                  options={SECTION_TYPE_OPTIONS}
                  onChange={(type) => updateSection(cIdx, sIdx, { type })}
                  disabled={disabled}
                />

                <div className="menu-builder__move" role="group" aria-label="Reorder section">
                  <button
                    type="button"
                    className="menu-builder__move-btn"
                    onClick={() => moveSection(cIdx, sIdx, -1)}
                    disabled={disabled || sIdx === 0}
                    aria-label="Move section up"
                    title="Move section up"
                  >
                    <ChevronUp />
                  </button>
                  <button
                    type="button"
                    className="menu-builder__move-btn"
                    onClick={() => moveSection(cIdx, sIdx, 1)}
                    disabled={disabled || sIdx === cuisine.sections.length - 1}
                    aria-label="Move section down"
                    title="Move section down"
                  >
                    <ChevronDown />
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn--danger btn--sm menu-builder__icon-btn"
                  onClick={() => removeSection(cIdx, sIdx)}
                  disabled={disabled}
                  aria-label="Remove section"
                >
                  <Trash01 />
                </button>
              </div>

              <div className="menu-builder__items">
                {section.items.map((item, iIdx) => {
                  if (!itemVisible(item, sectionMatched)) return null;

                  return (
                  <div key={iIdx} className="menu-builder__item">
                    <div className="menu-builder__item-row">
                      <label className="auth-field menu-builder__grow">
                        <span>Dish name</span>
                        <input
                          value={item.name}
                          onChange={(e) =>
                            updateItem(cIdx, sIdx, iIdx, {
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g. Paneer Tikka"
                          disabled={disabled}
                        />
                      </label>

                      {section.type === "mixed" && (
                        <CustomSelect
                          label="Dish type"
                          value={item.itemType}
                          options={DISH_TYPE_OPTIONS}
                          onChange={(itemType) =>
                            updateItem(cIdx, sIdx, iIdx, { itemType })
                          }
                          disabled={disabled}
                        />
                      )}

                      <CustomSelect
                        label="Pricing"
                        value={item.pricing}
                        options={PRICING_OPTIONS}
                        onChange={(pricing) =>
                          updateItem(cIdx, sIdx, iIdx, { pricing })
                        }
                        disabled={disabled}
                      />

                      <div className="menu-builder__move" role="group" aria-label="Reorder dish">
                        <button
                          type="button"
                          className="menu-builder__move-btn"
                          onClick={() => moveItem(cIdx, sIdx, iIdx, -1)}
                          disabled={disabled || iIdx === 0}
                          aria-label="Move dish up"
                          title="Move dish up"
                        >
                          <ChevronUp />
                        </button>
                        <button
                          type="button"
                          className="menu-builder__move-btn"
                          onClick={() => moveItem(cIdx, sIdx, iIdx, 1)}
                          disabled={disabled || iIdx === section.items.length - 1}
                          aria-label="Move dish down"
                          title="Move dish down"
                        >
                          <ChevronDown />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn btn--danger btn--sm menu-builder__icon-btn"
                        onClick={() => removeItem(cIdx, sIdx, iIdx)}
                        disabled={disabled}
                        aria-label="Remove dish"
                      >
                        <Trash01 />
                      </button>
                    </div>

                    <div className="menu-builder__item-row">
                      {item.pricing === "half-full" ? (
                        <>
                          <label className="auth-field">
                            <span>Half price</span>
                            <input
                              type="number"
                              min="0"
                              value={item.priceHalf}
                              onChange={(e) =>
                                updateItem(cIdx, sIdx, iIdx, {
                                  priceHalf: e.target.value,
                                })
                              }
                              placeholder="175"
                              disabled={disabled}
                            />
                          </label>
                          <label className="auth-field">
                            <span>Full price</span>
                            <input
                              type="number"
                              min="0"
                              value={item.priceFull}
                              onChange={(e) =>
                                updateItem(cIdx, sIdx, iIdx, {
                                  priceFull: e.target.value,
                                })
                              }
                              placeholder="300"
                              disabled={disabled}
                            />
                          </label>
                        </>
                      ) : (
                        <label className="auth-field">
                          <span>Price</span>
                          <input
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(cIdx, sIdx, iIdx, {
                                price: e.target.value,
                              })
                            }
                            placeholder="249"
                            disabled={disabled}
                          />
                        </label>
                      )}

                      <label className="auth-field menu-builder__grow">
                        <span>Description (optional)</span>
                        <input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(cIdx, sIdx, iIdx, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Short note for customers"
                          disabled={disabled}
                        />
                      </label>
                    </div>

                    <label className="menu-builder__check">
                      <input
                        type="checkbox"
                        checked={item.hasOptions}
                        onChange={(e) =>
                          updateItem(cIdx, sIdx, iIdx, {
                            hasOptions: e.target.checked,
                          })
                        }
                        disabled={disabled}
                      />
                      Combo options (rice/roti + curry choices)
                    </label>

                    {item.hasOptions && (
                      <div className="menu-builder__item-row">
                        <label className="auth-field menu-builder__grow">
                          <span>Base options (comma separated)</span>
                          <input
                            value={item.baseOptions}
                            onChange={(e) =>
                              updateItem(cIdx, sIdx, iIdx, {
                                baseOptions: e.target.value,
                              })
                            }
                            placeholder="Jeera Rice, Roti 2 units"
                            disabled={disabled}
                          />
                        </label>
                        <label className="auth-field menu-builder__grow">
                          <span>Curry options (comma separated)</span>
                          <input
                            value={item.curryOptions}
                            onChange={(e) =>
                              updateItem(cIdx, sIdx, iIdx, {
                                curryOptions: e.target.value,
                              })
                            }
                            placeholder="Rajma, Dal Makhni, Dal Tadka"
                            disabled={disabled}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
                })}

                <button
                  type="button"
                  className="menu-builder__add-btn"
                  onClick={() => addItem(cIdx, sIdx)}
                  disabled={disabled}
                >
                  <Plus />
                  Add dish
                </button>
              </div>
            </div>
            );
          })}

          <button
            type="button"
            className="menu-builder__add-btn"
            onClick={() => addSection(cIdx)}
            disabled={disabled}
          >
            <Plus />
            Add section
          </button>
        </div>
        );
      })}

      <button
        type="button"
        className="menu-builder__add-btn menu-builder__add-btn--primary"
        onClick={addCuisine}
        disabled={disabled}
      >
        <Plus />
        Add menu category
      </button>
    </div>
  );
}
