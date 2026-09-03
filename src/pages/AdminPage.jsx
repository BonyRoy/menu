import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Copy01, LinkExternal01, SearchMd, Trash01, XClose } from "@untitledui/icons";
import { requireSupabase } from "../lib/supabase";
import Spinner, { SpinnerButton } from "../components/Spinner";
import MenuQrCode from "../components/MenuQrCode";
import "../styles/platform.scss";

function shortId(id) {
  if (!id) return "Unknown";
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function groupByAccount(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = row.user_id || "unknown";
    if (!map.has(key)) {
      map.set(key, {
        userId: key,
        email: row.owner_email || "",
        menus: [],
      });
    }
    const account = map.get(key);
    if (!account.email && row.owner_email) {
      account.email = row.owner_email;
    }
    if (row.id) {
      account.menus.push(row);
    }
  }
  return [...map.values()];
}

export default function AdminPage() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const client = requireSupabase();
        const { data, error } = await client.rpc("admin_list_restaurants");

        if (error) {
          const fallback = await client
            .from("restaurants")
            .select("id, user_id, name, phone, logo_url, created_at, updated_at, is_online")
            .order("updated_at", { ascending: false });

          if (fallback.error) {
            toast.error(fallback.error.message || "Failed to load accounts");
            setRows([]);
          } else {
            toast.error("Run supabase/admin.sql in Supabase to show all accounts and emails.");
            setRows(fallback.data || []);
          }
        } else {
          setRows(data || []);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load accounts");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const accounts = useMemo(() => groupByAccount(rows), [rows]);
  const menuCount = useMemo(
    () => accounts.reduce((total, account) => total + account.menus.length, 0),
    [accounts],
  );

  const filteredAccounts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return accounts;

    return accounts
      .map((account) => {
        const accountMatch =
          account.email.toLowerCase().includes(needle) ||
          account.userId.toLowerCase().includes(needle);

        const menus = account.menus.filter((menu) => {
          const haystack = [menu.name, menu.phone, menu.id]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(needle);
        });

        if (accountMatch) return account;
        if (menus.length === 0) return null;
        return { ...account, menus };
      })
      .filter(Boolean);
  }, [accounts, query]);

  const toggleOnline = async (menu) => {
    const next = menu.is_online === false;
    setTogglingId(menu.id);
    const { error } = await requireSupabase()
      .from("restaurants")
      .update({ is_online: next })
      .eq("id", menu.id);
    setTogglingId(null);

    if (error) {
      toast.error(error.message || "Could not update menu visibility");
      return;
    }

    setRows((prev) =>
      prev.map((row) => (row.id === menu.id ? { ...row, is_online: next } : row)),
    );
    toast.success(next ? "Menu is online" : "Menu is offline");
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
      .eq("id", deleteTarget.id);

    setDeleting(false);

    if (error) {
      toast.error(error.message || "Failed to delete menu");
      return;
    }

    setRows((prev) => {
      const remaining = prev.filter((row) => row.id !== deleteTarget.id);
      const stillHasAccount = remaining.some((row) => row.user_id === deleteTarget.user_id);
      if (stillHasAccount) return remaining;
      return [
        ...remaining,
        {
          user_id: deleteTarget.user_id,
          owner_email: deleteTarget.owner_email,
          id: null,
        },
      ];
    });
    toast.success(`“${deleteTarget.name}” deleted`);
    setDeleteTarget(null);
  };

  return (
    <div className="platform admin-page">
      <header className="dashboard-header">
        <span className="platform-nav__brand">
          <img src="/logo.png" alt="" className="platform-nav__logo" />
          MenuCraft Admin
        </span>
        <span className="dashboard-header__email">
          {accounts.length} account{accounts.length === 1 ? "" : "s"} ·{" "}
          {menuCount} menu{menuCount === 1 ? "" : "s"}
        </span>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-top">
          <div>
            <h1>All accounts</h1>
            <p className="auth-muted">
              Every Google account, with or without menus.
            </p>
          </div>
        </div>

        <label className="admin-search">
          <SearchMd />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email, account, or menu…"
            aria-label="Search accounts and menus"
          />
        </label>

        {loading ? (
          <div className="spinner spinner--page">
            <Spinner size="lg" label="Loading accounts…" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="dashboard-empty">
            <p>{query.trim() ? "No matching accounts or menus." : "No accounts yet."}</p>
          </div>
        ) : (
          <ul className="admin-account-list">
            {filteredAccounts.map((account) => (
              <li key={account.userId} className="admin-account">
                <div className="admin-account__head">
                  <div>
                    <h2>{account.email || "Account"}</h2>
                    <code className="admin-account__id">{shortId(account.userId)}</code>
                  </div>
                  <span className="admin-account__count">
                    {account.menus.length} menu{account.menus.length === 1 ? "" : "s"}
                  </span>
                </div>

                {account.menus.length === 0 ? (
                  <p className="admin-account__empty">No menus yet.</p>
                ) : (
                  <ul className="admin-menu-list">
                    {account.menus.map((menu) => (
                      <li key={menu.id} className="admin-menu">
                        <div className="admin-menu__identity">
                          <div className="restaurant-card__logo">
                            {menu.logo_url ? (
                              <img src={menu.logo_url} alt="" />
                            ) : (
                              <span aria-hidden="true">
                                {menu.name?.charAt(0)?.toUpperCase() || "M"}
                              </span>
                            )}
                          </div>
                          <div className="admin-menu__body">
                            <h3>{menu.name}</h3>
                            {menu.phone ? (
                              <p className="auth-muted">{menu.phone}</p>
                            ) : null}
                            <code className="restaurant-card__uuid">{menu.id}</code>
                            <span className={`menu-status ${menu.is_online === false ? "is-off" : "is-on"}`}>
                              {menu.is_online === false ? "Offline" : "Online"}
                            </span>
                          </div>
                        </div>

                        <MenuQrCode restaurantId={menu.id} restaurantName={menu.name} />

                        <div className="admin-menu__actions">
                          <Link
                            to={`/menu/${menu.id}`}
                            className="btn btn--primary btn--sm"
                          >
                            <LinkExternal01 />
                            View
                          </Link>
                          <button
                            type="button"
                            className="btn btn--copy btn--sm"
                            onClick={() => copyMenuLink(menu.id)}
                          >
                            <Copy01 />
                            Copy link
                          </button>
                          <button
                            type="button"
                            className={`admin-menu__toggle ${menu.is_online === false ? "is-off" : "is-on"}`}
                            onClick={() => toggleOnline(menu)}
                            disabled={togglingId === menu.id}
                            aria-pressed={menu.is_online !== false}
                          >
                            {togglingId === menu.id
                              ? "Updating…"
                              : menu.is_online === false
                                ? "Go online"
                                : "Go offline"}
                          </button>
                          <button
                            type="button"
                            className="admin-menu__delete"
                            onClick={() => setDeleteTarget(menu)}
                            aria-label={`Delete ${menu.name}`}
                          >
                            <Trash01 />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {deleteTarget && (
        <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-delete-title">
          <button
            type="button"
            className="confirm-modal__backdrop"
            aria-label="Close"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="confirm-modal__panel">
            <div className="confirm-modal__head">
              <h2 id="admin-delete-title">Delete menu?</h2>
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
              This will permanently delete <strong>{deleteTarget.name}</strong> and
              its menu. This cannot be undone.
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
    </div>
  );
}
