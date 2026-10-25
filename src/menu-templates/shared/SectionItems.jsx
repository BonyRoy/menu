import { CurrencyRupee, Heart, Zap } from "@untitledui/icons";
import { ItemPrice, DietDot } from "../../components/menu/MenuParts";
import { resolveItemType } from "../../components/menu/menuUtils";

export default function SectionItems({ items, sectionType, currency, variant = "classic" }) {
  return (
    <ul className={`item-list item-list--${variant}`}>
      {items.map((item) => {
        const type = resolveItemType(item, sectionType);
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
              {variant === "classic" && (
                <CurrencyRupee className="item__rupee only-desk" />
              )}
              <ItemPrice item={item} currency={currency} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
