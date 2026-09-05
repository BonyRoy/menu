import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { requireSupabase } from "../lib/supabase";
import MenuView from "../components/menu/MenuView";
import Spinner from "../components/Spinner";
import "../App.scss";
import "../styles/platform.scss";

function isMenuOnline(value) {
  return value !== false && value !== "false" && value !== 0;
}

export default function MenuPage() {
  const { uuid } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [menus, setMenus] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const client = requireSupabase();
      const publicMenu = await client.rpc("get_public_menu", { menu_id: uuid });
      let data = Array.isArray(publicMenu.data) ? publicMenu.data[0] : publicMenu.data;

      if (!publicMenu.error && !data) {
        setError("This menu is currently offline.");
        setLoading(false);
        return;
      }

      if (publicMenu.error) {
        const fallback = await client
          .from("restaurants")
          .select("*")
          .eq("id", uuid)
          .maybeSingle();

        if (cancelled) return;

        if (fallback.error || !fallback.data) {
          const message = "Restaurant not found. Check the menu link and try again.";
          setError(message);
          toast.error(message);
          setLoading(false);
          return;
        }

        data = fallback.data;
      }

      if (cancelled) return;

      if (!isMenuOnline(data.is_online)) {
        setError("This menu is currently offline.");
        setLoading(false);
        return;
      }

      setRestaurant({
        name: data.name,
        tagline: data.tagline,
        phone: data.phone,
        address: data.address,
        currency: data.currency,
        logo_url: data.logo_url,
        hero_image_url: data.hero_image_url,
        theme: data.theme,
        venue: data.venue,
      });
      setMenus(data.menu_data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [uuid]);

  if (loading) {
    return (
      <div className="page">
        <div className="menu-empty">
          <Spinner size="lg" label="Loading menu…" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="menu-empty">
          <p>{error}</p>
          <Link to="/" className="btn btn--primary menu-empty__link">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return <MenuView restaurant={restaurant} menus={menus} />;
}
