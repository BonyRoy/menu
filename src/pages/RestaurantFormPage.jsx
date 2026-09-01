import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { SearchMd, Upload01, XClose } from "@untitledui/icons";
import { useAuth } from "../context/AuthContext";
import {
  DEFAULT_HERO_IMAGE,
  requireSupabase,
  uploadRestaurantAsset,
} from "../lib/supabase";
import MenuBuilder, {
  menusToBuilder,
  builderToMenus,
  validateBuilder,
} from "../components/MenuBuilder";
import Spinner, { SpinnerButton } from "../components/Spinner";
import { DEFAULT_THEME, THEME_PRESETS, resolveTheme } from "../lib/themes";
import "../styles/platform.scss";

const EMPTY_FORM = {
  name: "",
  tagline: "",
  phone: "",
  address: "",
  currency: "",
};

function snapshotOf({
  form,
  menuBuilder,
  logoFile,
  heroFile,
  existingLogoUrl,
  existingHeroUrl,
  themeId,
}) {
  return JSON.stringify({
    form,
    menuBuilder,
    logoChanged: Boolean(logoFile),
    heroChanged: Boolean(heroFile),
    existingLogoUrl: existingLogoUrl || "",
    existingHeroUrl: existingHeroUrl || "",
    themeId: themeId || DEFAULT_THEME.id,
  });
}

export default function RestaurantFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [menuBuilder, setMenuBuilder] = useState(() => menusToBuilder({}));
  const [logoFile, setLogoFile] = useState(null);
  const [heroFile, setHeroFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState(null);
  const [existingHeroUrl, setExistingHeroUrl] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [baseline, setBaseline] = useState(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [themeId, setThemeId] = useState(DEFAULT_THEME.id);

  useEffect(() => {
    if (isEdit) return;
    setBaseline(
      snapshotOf({
        form: EMPTY_FORM,
        menuBuilder: menusToBuilder({}),
        logoFile: null,
        heroFile: null,
        existingLogoUrl: null,
        existingHeroUrl: null,
        themeId: DEFAULT_THEME.id,
      }),
    );
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;

    async function load() {
      setLoading(true);
      const { data, error: fetchError } = await requireSupabase()
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !data) {
        toast.error("Restaurant not found.");
        setLoading(false);
        navigate("/dashboard", { replace: true });
        return;
      }

      const nextForm = {
        name: data.name || "",
        tagline: data.tagline || "",
        phone: data.phone || "",
        address: data.address || "",
        currency: data.currency || "INR",
      };
      const nextMenu = menusToBuilder(data.menu_data);
      const nextThemeId = resolveTheme(data.theme).id;

      setForm(nextForm);
      setMenuBuilder(nextMenu);
      setThemeId(nextThemeId);
      setExistingLogoUrl(data.logo_url);
      setExistingHeroUrl(data.hero_image_url);
      if (data.logo_url) setLogoPreview(data.logo_url);
      if (data.hero_image_url) setHeroPreview(data.hero_image_url);
      setBaseline(
        snapshotOf({
          form: nextForm,
          menuBuilder: nextMenu,
          logoFile: null,
          heroFile: null,
          existingLogoUrl: data.logo_url,
          existingHeroUrl: data.hero_image_url,
          themeId: nextThemeId,
        }),
      );
      setLoading(false);
    }

    load();
  }, [id, isEdit, user.id, navigate]);

  const isDirty = useMemo(() => {
    if (!baseline) return false;
    return (
      snapshotOf({
        form,
        menuBuilder,
        logoFile,
        heroFile,
        existingLogoUrl,
        existingHeroUrl,
        themeId,
      }) !== baseline
    );
  }, [
    baseline,
    form,
    menuBuilder,
    logoFile,
    heroFile,
    existingLogoUrl,
    existingHeroUrl,
    themeId,
  ]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    toast.info("Logo selected");
  };

  const handleHeroChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
    toast.info("Hero image selected");
  };

  const handleBack = () => {
    if (saving) return;
    if (isDirty) {
      setLeaveConfirmOpen(true);
      return;
    }
    navigate("/dashboard");
  };

  const confirmLeave = () => {
    setLeaveConfirmOpen(false);
    navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDirty || saving) return;

    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Restaurant name and phone are required.");
      return;
    }

    const menuError = validateBuilder(menuBuilder);
    if (menuError) {
      toast.error(menuError);
      return;
    }

    const menuData = builderToMenus(menuBuilder);
    console.log("menu_data JSON:", menuData);
    setSaving(true);

    try {
      const restaurantId = isEdit ? id : crypto.randomUUID();

      let logoUrl = existingLogoUrl;
      let heroUrl = existingHeroUrl || DEFAULT_HERO_IMAGE;

      if (logoFile) {
        logoUrl = await uploadRestaurantAsset(
          user.id,
          restaurantId,
          logoFile,
          "logo",
        );
      }
      if (heroFile) {
        heroUrl = await uploadRestaurantAsset(
          user.id,
          restaurantId,
          heroFile,
          "hero",
        );
      }

      const payload = {
        id: restaurantId,
        user_id: user.id,
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        currency: form.currency.trim() || "INR",
        logo_url: logoUrl,
        hero_image_url: heroUrl,
        menu_data: menuData,
        theme: { id: themeId },
      };

      const { error: saveError } = isEdit
        ? await requireSupabase().from("restaurants").update(payload).eq("id", id)
        : await requireSupabase().from("restaurants").insert(payload);

      if (saveError) throw saveError;

      toast.success(isEdit ? "Restaurant updated" : "Restaurant created");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to save restaurant.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <Spinner size="lg" label="Loading restaurant…" />
      </div>
    );
  }

  return (
    <div className="platform form-page">
      {saving && (
        <div className="spinner-overlay">
          <Spinner
            size="lg"
            label={isEdit ? "Saving changes…" : "Creating restaurant…"}
          />
        </div>
      )}

      <header className="form-sticky-top">
        <label className="form-search">
          <SearchMd />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes, sections, categories…"
            disabled={saving}
          />
        </label>
      </header>

      <main className="form-main form-main--with-bar">
        <h1>{isEdit ? "Edit restaurant" : "New restaurant"}</h1>
        <p className="auth-muted">
          Fill in your details, upload images, and build your menu with simple
          forms.
        </p>

        <form
          id="restaurant-form"
          className="restaurant-form"
          onSubmit={handleSubmit}
        >
          <section className="form-section">
            <h2>Restaurant details</h2>
            <div className="form-grid">
              <label className="auth-field form-field--wide">
                <span>Restaurant name *</span>
                <input
                  value={form.name}
                  onChange={handleChange("name")}
                  required
                  placeholder="Red Chilli & Spyyce Food Services"
                  disabled={saving}
                />
              </label>
              <label className="auth-field form-field--wide">
                <span>Tagline</span>
                <input
                  value={form.tagline}
                  onChange={handleChange("tagline")}
                  placeholder="Specialist in Catering Bulk Orders..."
                  disabled={saving}
                />
              </label>
              <label className="auth-field">
                <span>Phone *</span>
                <input
                  value={form.phone}
                  onChange={handleChange("phone")}
                  required
                  placeholder="9819958246"
                  disabled={saving}
                />
              </label>
              <label className="auth-field">
                <span>Currency</span>
                <input
                  value={form.currency}
                  onChange={handleChange("currency")}
                  placeholder="e.g. INR"
                  disabled={saving}
                />
              </label>
              <label className="auth-field form-field--wide">
                <span>Address</span>
                <textarea
                  value={form.address}
                  onChange={handleChange("address")}
                  rows={2}
                  placeholder="Shop address..."
                  disabled={saving}
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <h2>Images</h2>
            <div className="form-uploads">
              <label className="upload-card">
                <span>Logo</span>
                <div className="upload-card__preview upload-card__preview--logo">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" />
                  ) : (
                    <span className="upload-card__empty">No logo yet</span>
                  )}
                </div>
                <span className="upload-card__btn">
                  <Upload01 />
                  {logoFile ? logoFile.name : "Upload logo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  hidden
                  disabled={saving}
                />
              </label>

              <label className="upload-card">
                <span>Hero image</span>
                <div className="upload-card__preview upload-card__preview--hero">
                  {heroPreview ? (
                    <img src={heroPreview} alt="Hero preview" />
                  ) : (
                    <span className="upload-card__empty">
                      No cover photo yet
                    </span>
                  )}
                </div>
                <span className="upload-card__btn">
                  <Upload01 />
                  {heroFile ? heroFile.name : "Upload hero image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeroChange}
                  hidden
                  disabled={saving}
                />
              </label>
            </div>
            <p className="form-hint">
              Upload your own logo and cover photo. If you skip the cover photo,
              a default food image will be used on the menu page.
            </p>
          </section>

          <section className="form-section">
            <h2>Theme</h2>
            <p className="form-hint">
              Pick a look for your public menu — background and highlight
              colors.
            </p>
            <div className="theme-grid">
              {THEME_PRESETS.map((preset) => {
                const active = themeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`theme-card ${active ? "is-active" : ""}`}
                    onClick={() => setThemeId(preset.id)}
                    disabled={saving}
                    aria-pressed={active}
                  >
                    <span
                      className="theme-card__preview"
                      style={{ background: preset.paper }}
                    >
                      <span
                        className="theme-card__swatch"
                        style={{ background: preset.accent }}
                      >
                        INDIAN
                      </span>
                      <span
                        className="theme-card__swatch theme-card__swatch--ghost"
                        style={{ color: "#161210" }}
                      >
                        CHINESE
                      </span>
                    </span>
                    <span className="theme-card__meta">
                      <span className="theme-card__name">{preset.name}</span>
                      <span className="theme-card__dots" aria-hidden="true">
                        <i style={{ background: preset.paper }} />
                        <i style={{ background: preset.paper2 }} />
                        <i style={{ background: preset.accent }} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="form-section">
            <h2>Menu</h2>
            <p className="form-hint">
              Add categories (Indian, Chinese…), sections, and dishes. Use
              dropdowns for veg / non-veg / both and single or half-full prices.
            </p>
            <MenuBuilder
              value={menuBuilder}
              onChange={setMenuBuilder}
              disabled={saving}
              searchQuery={search}
            />
          </section>
        </form>
      </main>

      <div className="form-sticky-actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleBack}
          disabled={saving}
        >
          Back
        </button>
        <button
          type="submit"
          form="restaurant-form"
          className="btn btn--primary"
          disabled={saving || !isDirty}
          title={!isDirty ? "No changes to save" : undefined}
        >
          <SpinnerButton loading={saving}>
            {saving
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save changes"
                : "Create restaurant"}
          </SpinnerButton>
        </button>
      </div>

      {leaveConfirmOpen && (
        <div
          className="confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-title"
        >
          <button
            type="button"
            className="confirm-modal__backdrop"
            aria-label="Close"
            onClick={() => setLeaveConfirmOpen(false)}
          />
          <div className="confirm-modal__panel">
            <div className="confirm-modal__head">
              <h2 id="leave-title">Discard changes?</h2>
              <button
                type="button"
                className="confirm-modal__close"
                onClick={() => setLeaveConfirmOpen(false)}
                aria-label="Close"
              >
                <XClose />
              </button>
            </div>
            <p className="confirm-modal__text">
              You have unsaved changes. If you go back now, those changes will
              be lost.
            </p>
            <div className="confirm-modal__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setLeaveConfirmOpen(false)}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={confirmLeave}
              >
                Discard & go back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
