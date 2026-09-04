import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Copy01, LinkExternal01, LogOut01, SearchMd, Trash01, XClose } from "@untitledui/icons";
import { requireSupabase } from "../lib/supabase";
import { clearAdminSession, getAdminSession, setAdminSession } from "../lib/adminSession";
import Spinner, { SpinnerButton } from "../components/Spinner";
import PasswordField from "../components/PasswordField";
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

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`admin-filter__chip ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CredentialsTab() {
  const session = getAdminSession();
  const [currentId, setCurrentId] = useState(session?.loginId || "");
  const [loginId, setLoginId] = useState(session?.loginId || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadId() {
      try {
        const { data } = await requireSupabase().rpc("admin_get_login_id");
        if (data) {
          setCurrentId(data);
          setLoginId(data);
        }
      } catch {
        /* keep session value */
      }
    }

    loadId();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const { error } = await requireSupabase().rpc("admin_update_credentials", {
        p_current_password: currentPassword,
        p_new_login_id: loginId.trim(),
        p_new_password: newPassword,
      });

      if (error) {
        toast.error(error.message || "Could not update credentials");
        return;
      }

      setAdminSession(loginId.trim());
      setCurrentId(loginId.trim());
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Admin credentials updated");
    } catch (err) {
      toast.error(err.message || "Could not update credentials");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-credentials">
      <div className="dashboard-top">
        <div>
          <h1>Admin credentials</h1>
          <p className="auth-muted">
            Change the admin ID and password used to open this page.
          </p>
        </div>
      </div>

      <form className="admin-credentials__form" onSubmit={handleSave}>
        <p className="auth-muted">
          Current ID: <strong>{currentId || "—"}</strong>
        </p>

        <label className="auth-field">
          <span>Admin ID</span>
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
            disabled={saving}
          />
        </label>

        <PasswordField
          label="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={saving}
          autoComplete="current-password"
        />

        <PasswordField
          label="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={saving}
          required={false}
          autoComplete="new-password"
          placeholder="Leave blank to keep current password"
        />

        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={saving}
          required={false}
          autoComplete="new-password"
          placeholder="Repeat new password"
        />

        <button type="submit" className="btn btn--primary" disabled={saving}>
          <SpinnerButton loading={saving}>
            {saving ? "Saving…" : "Save credentials"}
          </SpinnerButton>
        </button>
      </form>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("accounts");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [menuFilter, setMenuFilter] = useState("all");
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
  const withMenusCount = useMemo(
    () => accounts.filter((account) => account.menus.length > 0).length,
    [accounts],
  );
  const noMenusCount = accounts.length - withMenusCount;
  const enabledCount = useMemo(
    () => accounts.reduce((total, account) => (
      total + account.menus.filter((menu) => menu.is_online !== false).length
    ), 0),
    [accounts],
  );
  const disabledCount = menuCount - enabledCount;

  const filteredAccounts = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return accounts
      .map((account) => {
        const accountMatch = !needle || (
          account.email.toLowerCase().includes(needle) ||
          account.userId.toLowerCase().includes(needle)
        );

        let menus = account.menus.filter((menu) => {
          if (!needle || accountMatch) return true;
          const haystack = [menu.name, menu.phone, menu.id]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(needle);
        });

        if (menuFilter === "enabled") {
          menus = menus.filter((menu) => menu.is_online !== false);
        }
        if (menuFilter === "disabled") {
          menus = menus.filter((menu) => menu.is_online === false);
        }

        if (needle && !accountMatch && menus.length === 0) return null;
        if (accountFilter === "with-menus" && account.menus.length === 0) return null;
        if (accountFilter === "no-menus" && account.menus.length > 0) return null;
        if (menuFilter !== "all" && menus.length === 0) return null;

        return { ...account, menus };
      })
      .filter(Boolean);
  }, [accounts, query, accountFilter, menuFilter]);

  const toggleOnline = async (menu) => {
    const next = menu.is_online === false;
    setTogglingId(menu.id);
    const { error } = await requireSupabase().rpc("admin_set_menu_online", {
      menu_id: menu.id,
      next_online: next,
    });
    setTogglingId(null);

    if (error) {
      toast.error(error.message || "Could not update menu visibility");
      return;
    }

    setRows((prev) =>
      prev.map((row) => (row.id === menu.id ? { ...row, is_online: next } : row)),
    );
    toast.success(next ? "Menu enabled" : "Menu disabled");
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

    if (deleteTarget.type === "account") {
      const { error } = await requireSupabase().rpc("admin_delete_account", {
        target_user_id: deleteTarget.userId,
      });
      setDeleting(false);

      if (error) {
        toast.error(error.message || "Failed to delete account");
        return;
      }

      setRows((prev) => prev.filter((row) => row.user_id !== deleteTarget.userId));
      toast.success(`${deleteTarget.email || "Account"} deleted`);
      setDeleteTarget(null);
      return;
    }

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
        <div className="dashboard-header__actions">
          <span className="dashboard-header__email">
            {accounts.length} account{accounts.length === 1 ? "" : "s"} ·{" "}
            {menuCount} menu{menuCount === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              clearAdminSession();
              navigate("/admin/login", { replace: true });
            }}
          >
            <LogOut01 />
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="admin-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`admin-tabs__tab ${tab === "accounts" ? "is-active" : ""}`}
            aria-selected={tab === "accounts"}
            onClick={() => setTab("accounts")}
          >
            Accounts
          </button>
          <button
            type="button"
            role="tab"
            className={`admin-tabs__tab ${tab === "credentials" ? "is-active" : ""}`}
            aria-selected={tab === "credentials"}
            onClick={() => setTab("credentials")}
          >
            Credentials
          </button>
        </div>

        {tab === "credentials" ? <CredentialsTab /> : null}

        {tab === "accounts" ? (
          <>
        <div className="dashboard-top">
          <div>
            <h1>All accounts</h1>
            <p className="auth-muted">
              Filter accounts and menus, or delete an account entirely.
            </p>
          </div>
        </div>

        <div className="admin-toolbar">
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

          <div className="admin-filters">
            <div className="admin-filter">
              <span className="admin-filter__label">Accounts</span>
              <div className="admin-filter__chips">
                <FilterChip active={accountFilter === "all"} onClick={() => setAccountFilter("all")}>
                  All ({accounts.length})
                </FilterChip>
                <FilterChip active={accountFilter === "with-menus"} onClick={() => setAccountFilter("with-menus")}>
                  With menus ({withMenusCount})
                </FilterChip>
                <FilterChip active={accountFilter === "no-menus"} onClick={() => setAccountFilter("no-menus")}>
                  No menus ({noMenusCount})
                </FilterChip>
              </div>
            </div>

            <div className="admin-filter">
              <span className="admin-filter__label">Menus</span>
              <div className="admin-filter__chips">
                <FilterChip active={menuFilter === "all"} onClick={() => setMenuFilter("all")}>
                  All ({menuCount})
                </FilterChip>
                <FilterChip active={menuFilter === "enabled"} onClick={() => setMenuFilter("enabled")}>
                  Enabled ({enabledCount})
                </FilterChip>
                <FilterChip active={menuFilter === "disabled"} onClick={() => setMenuFilter("disabled")}>
                  Disabled ({disabledCount})
                </FilterChip>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="spinner spinner--page">
            <Spinner size="lg" label="Loading accounts…" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="dashboard-empty">
            <p>No matching accounts or menus.</p>
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
                  <div className="admin-account__meta">
                    <span className="admin-account__count">
                      {account.menus.length} menu{account.menus.length === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      className="admin-menu__delete"
                      onClick={() => setDeleteTarget({ type: "account", ...account })}
                      aria-label={`Delete account ${account.email || account.userId}`}
                    >
                      <Trash01 />
                    </button>
                  </div>
                </div>

                {account.menus.length === 0 ? (
                  <p className="admin-account__empty">No menus yet.</p>
                ) : (
                  <ul className="admin-menu-list">
                    {account.menus.map((menu) => (
                      <li key={menu.id} className="admin-menu">
                        <div className="admin-menu__top">
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
                              <div className="admin-menu__title">
                                <h3>{menu.name}</h3>
                                <span className={`menu-status ${menu.is_online === false ? "is-off" : "is-on"}`}>
                                  {menu.is_online === false ? "Disabled" : "Enabled"}
                                </span>
                              </div>
                              {menu.phone ? (
                                <p className="auth-muted">{menu.phone}</p>
                              ) : null}
                              <code className="admin-menu__id" title={menu.id}>
                                {shortId(menu.id)}
                              </code>
                            </div>
                          </div>
                          <MenuQrCode restaurantId={menu.id} restaurantName={menu.name} />
                        </div>

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
                            className="btn btn--ghost btn--sm"
                            onClick={() => copyMenuLink(menu.id)}
                          >
                            <Copy01 />
                            Copy
                          </button>
                          <button
                            type="button"
                            className={`btn btn--sm admin-menu__toggle ${menu.is_online === false ? "is-off" : "is-on"}`}
                            onClick={() => toggleOnline(menu)}
                            disabled={togglingId === menu.id}
                            aria-pressed={menu.is_online !== false}
                          >
                            {togglingId === menu.id
                              ? "Updating…"
                              : menu.is_online === false
                                ? "Enable"
                                : "Disable"}
                          </button>
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            onClick={() => setDeleteTarget({ type: "menu", ...menu })}
                          >
                            <Trash01 />
                            Delete
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
          </>
        ) : null}
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
              <h2 id="admin-delete-title">
                {deleteTarget.type === "account" ? "Delete account?" : "Delete menu?"}
              </h2>
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
              {deleteTarget.type === "account" ? (
                <>
                  This will permanently delete{" "}
                  <strong>{deleteTarget.email || "this account"}</strong> and all of
                  their menus. This cannot be undone.
                </>
              ) : (
                <>
                  This will permanently delete <strong>{deleteTarget.name}</strong> and
                  its menu. This cannot be undone.
                </>
              )}
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
