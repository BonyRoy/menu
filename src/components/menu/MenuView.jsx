import { resolveTemplate } from "../../menu-templates";
import { usePublicMenu } from "../../menu-templates/usePublicMenu";
import "../../App.scss";
import "../../styles/platform.scss";

export default function MenuView({ restaurant, menus }) {
  const m = usePublicMenu(restaurant, menus);
  const template = resolveTemplate(restaurant.theme);
  const Template = template.Template;

  if (!m.activeMenu) {
    return (
      <div className="page">
        <div className="menu-empty">
          <p>No menu data available for this restaurant.</p>
        </div>
      </div>
    );
  }

  return <Template m={m} />;
}
