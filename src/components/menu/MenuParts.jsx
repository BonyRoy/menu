import { formatPrice } from "./menuUtils";

export function ItemPrice({ item, currency }) {
  if (item.priceHalf != null && item.priceFull != null) {
    return (
      <span className="price price--split">
        <span>
          <small>H</small> {formatPrice(item.priceHalf, currency)}
        </span>
        <span className="price__sep">·</span>
        <span>
          <small>F</small> {formatPrice(item.priceFull, currency)}
        </span>
      </span>
    );
  }
  return <span className="price">{formatPrice(item.price, currency)}</span>;
}

export function DietDot({ type }) {
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
