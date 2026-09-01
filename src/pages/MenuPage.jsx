import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { requireSupabase } from "../lib/supabase";
import MenuView from "../components/menu/MenuView";
import Spinner from "../components/Spinner";
import "../App.scss";
import "../styles/platform.scss";

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

      const { data, error: fetchError } = await requireSupabase()
        .from("restaurants")
        .select("*")
        .eq("id", uuid)
        .single();

      if (cancelled) return;

      if (fetchError || !data) {
        const message = "Restaurant not found. Check the menu link and try again.";
        setError(message);
        toast.error(message);
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
