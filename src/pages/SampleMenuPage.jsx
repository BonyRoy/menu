import MenuView from "../components/menu/MenuView";
import menuData from "../data/menu.json";
import sampleLogo from "../assets/chilli-logo.png";

const SAMPLE_HERO =
  "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1920&q=80";

export default function SampleMenuPage() {
  const restaurant = {
    ...menuData.restaurant,
    logo_url: sampleLogo,
    hero_image_url: `${SAMPLE_HERO}&v=sample`,
  };

  return <MenuView restaurant={restaurant} menus={menuData.menus} />;
}
