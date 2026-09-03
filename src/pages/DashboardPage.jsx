import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Copy01,
  Edit01,
  LinkExternal01,
  LogOut01,
  Plus,
  Trash01,
  XClose,
} from "@untitledui/icons";
import { useAuth } from "../context/AuthContext";
import { requireSupabase } from "../lib/supabase";
import Spinner, { SpinnerButton } from "../components/Spinner";
import MenuQrCode from "../components/MenuQrCode";
import "../styles/platform.scss";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await requireSupabase()
        .from("restaurants")
        .select("id, name, phone, logo_url, created_at, updated_at, is_online")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        toast.error(error.message || "Failed to load restaurants");
        setRestaurants([]);
      } else {
        setRestaurants(data || []);
      }
      setLoading(false);
    }

    load();
  }, [user.id]);

  const confirmSignOut = async () => {
    setSigningOut(true);
    const { error } = await signOut();
    setSigningOut(false);
    if (error) {
      toast.error(error.message || "Sign out failed");
      return;
    }
    setSignOutConfirmOpen(false);
    toast.success("Signed out");
    navigate("/");
  };

  const goOffline = async (restaurant) => {
    if (restaurant.is_online === false) return;
    setTogglingId(restaurant.id);
    const { error } = await requireSupabase()
      .from("restaurants")
      .update({ is_online: false })
      .eq("id", restaurant.id)
      .eq("user_id", user.id);
    setTogglingId(null);

    if (error) {
      toast.error(error.message || "Could not take menu offline");
      return;
    }

    setRestaurants((prev) =>
      prev.map((item) => (item.id === restaurant.id ? { ...item, is_online: false } : item)),
    );
    toast.success("Menu is offline. An admin can put it back online.");
  };

  const copyMenuLink = async (id) => {
    const url = `${window.location.origin}/menu/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Menu link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const { error } = await requireSupabase()
      .from("restaurants")
      .delete()
      .eq("id", deleteTarget.id)
      .eq("user_id", user.id);

    setDeleting(false);

    if (error) {
      toast.error(error.message || "Failed to delete restaurant");
      return;
    }

    setRestaurants((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success(`“${deleteTarget.name}” deleted`);
    setDeleteTarget(null);
  };

  return (
    <div className="platform dashboard">
      <header className="dashboard-header">
        <Link to="/" className="platform-nav__brand">
          <img src="/logo.png" alt="" className="platform-nav__logo" />
          MenuCraft
        </Link>
        <div className="dashboard-header__actions">
          <span className="dashboard-header__email">{user.email}</span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setSignOutConfirmOpen(true)}
            disabled={signingOut}
          >
            <LogOut01 />
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-top">
          <div>
            <h1>Your restaurants</h1>
            <p className="auth-muted">Create and manage digital menus for each location.</p>
          </div>
          <Link to="/dashboard/new" className="btn btn--primary">
            <Plus />
            New restaurant
          </Link>
        </div>

        {loading ? (
          <div className="spinner spinner--page">
            <Spinner size="lg" label="Loading restaurants…" />
          </div>
        ) : restaurants.length === 0 ? (
          <div className="dashboard-empty">
            <p>No restaurants yet.</p>
            <Link to="/dashboard/new" className="btn btn--primary">
              <Plus />
              Create your first menu
            </Link>
          </div>
        ) : (
          <ul className="restaurant-list">
            {restaurants.map((r) => (
              <li key={r.id} className="restaurant-card">
                <div className="restaurant-card__top">
                  <div className="restaurant-card__identity">
                    <div className="restaurant-card__logo">
                      {r.logo_url ? (
                        <img src={r.logo_url} alt={`${r.name} logo`} />
                      ) : (
                        <span aria-hidden="true">{r.name?.charAt(0)?.toUpperCase() || "R"}</span>
                      )}
                    </div>
                    <div className="restaurant-card__body">
                      <h2>{r.name}</h2>
                      <p className="auth-muted">{r.phone}</p>
                      <code className="restaurant-card__uuid">{r.id}</code>
                      <span className={`menu-status ${r.is_online === false ? "is-off" : "is-on"}`}>
                        {r.is_online === false ? "Offline" : "Online"}
                      </span>
                    </div>
                  </div>
                  <MenuQrCode restaurantId={r.id} restaurantName={r.name} />
                </div>
                <div className="restaurant-card__actions">
                  <Link to={`/menu/${r.id}`} className="btn btn--primary btn--sm restaurant-card__btn">
                    <LinkExternal01 />
                    View menu
                  </Link>
                  <Link to={`/dashboard/edit/${r.id}`} className="btn btn--update btn--sm restaurant-card__btn">
                    <Edit01 />
                    Update
                  </Link>
                  <button
                    type="button"
                    className="btn btn--copy btn--sm restaurant-card__btn"
                    onClick={() => copyMenuLink(r.id)}
                  >
                    <Copy01 />
                    Copy link
                  </button>
                  {r.is_online !== false && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm restaurant-card__btn"
                      onClick={() => goOffline(r)}
                      disabled={togglingId === r.id}
                    >
                      {togglingId === r.id ? "Updating…" : "Disable"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--danger btn--sm restaurant-card__btn"
                    onClick={() => setDeleteTarget(r)}
                  >
                    <Trash01 />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {deleteTarget && (
        <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <button
            type="button"
            className="confirm-modal__backdrop"
            aria-label="Close"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="confirm-modal__panel">
            <div className="confirm-modal__head">
              <h2 id="delete-title">Delete restaurant?</h2>
              <button
                type="button"
                className="confirm-modal__close"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                aria-label="Close"
              >
                <XClose />
              </button>
            </div>
            <p className="confirm-modal__text">
              This will permanently delete <strong>{deleteTarget.name}</strong> and its
              menu. This cannot be undone.
            </p>
            <div className="confirm-modal__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                <SpinnerButton loading={deleting}>
                  {deleting ? "Deleting…" : "Yes, delete"}
                </SpinnerButton>
              </button>
            </div>
          </div>
        </div>
      )}

      {signOutConfirmOpen && (
        <div
          className="confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-title"
        >
          <button
            type="button"
            className="confirm-modal__backdrop"
            aria-label="Close"
            onClick={() => !signingOut && setSignOutConfirmOpen(false)}
          />
          <div className="confirm-modal__panel">
            <div className="confirm-modal__head">
              <h2 id="signout-title">Sign out?</h2>
              <button
                type="button"
                className="confirm-modal__close"
                onClick={() => setSignOutConfirmOpen(false)}
                disabled={signingOut}
                aria-label="Close"
              >
                <XClose />
              </button>
            </div>
            <p className="confirm-modal__text">
              Are you sure you want to sign out of MenuCraft?
            </p>
            <div className="confirm-modal__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setSignOutConfirmOpen(false)}
                disabled={signingOut}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={confirmSignOut}
                disabled={signingOut}
              >
                <SpinnerButton loading={signingOut}>
                  {signingOut ? "Signing out…" : "Yes, sign out"}
                </SpinnerButton>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
