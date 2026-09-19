import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Save01, SearchMd, Upload01 } from "@untitledui/icons";
import { requireSupabase, uploadRestaurantAsset } from "../lib/supabase";
import Spinner, { SpinnerButton } from "../components/Spinner";
import "../styles/platform.scss";

function prettyJson(value) {
  return JSON.stringify(value || {}, null, 2);
}

export default function AdminRestaurantEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuJson, setMenuJson] = useState("");
  const [detailsJson, setDetailsJson] = useState("");
  const [initialMenuJson, setInitialMenuJson] = useState("");
  const [initialDetailsJson, setInitialDetailsJson] = useState("");
  const [jsonTab, setJsonTab] = useState("details");
  const [jsonSearch, setJsonSearch] = useState("");
  const [activeMatch, setActiveMatch] = useState(0);
  const [logoFile, setLogoFile] = useState(null);
  const [heroFile, setHeroFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [heroPreview, setHeroPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const objectUrls = useRef([]);
  const jsonTextarea = useRef(null);

  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  useEffect(() => {
    async function loadRestaurant() {
      setLoading(true);
      const { data, error } = await requireSupabase()
        .from("restaurants")
        .select("id, user_id, name, tagline, phone, address, currency, logo_url, hero_image_url, menu_data, theme, venue, is_online")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error(error?.message || "Restaurant not found");
        navigate("/admin", { replace: true });
        return;
      }

      setRestaurant(data);
      const nextMenuJson = prettyJson(data.menu_data);
      const nextDetailsJson = prettyJson({
        name: data.name,
        tagline: data.tagline,
        phone: data.phone,
        address: data.address,
        currency: data.currency,
        theme: data.theme,
        venue: data.venue,
        is_online: data.is_online,
      });
      setMenuJson(nextMenuJson);
      setDetailsJson(nextDetailsJson);
      setInitialMenuJson(nextMenuJson);
      setInitialDetailsJson(nextDetailsJson);
      setLogoPreview(data.logo_url || "");
      setHeroPreview(data.hero_image_url || "");
      setLoading(false);
    }

    loadRestaurant();
  }, [id, navigate]);

  const selectImage = (kind) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      event.target.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    if (kind === "logo") {
      setLogoFile(file);
      setLogoPreview(url);
    } else {
      setHeroFile(file);
      setHeroPreview(url);
    }
    // Permit selecting the same file again after changing their mind.
    event.target.value = "";
  };

  const searchMatches = (() => {
    const needle = jsonSearch.trim().toLowerCase();
    if (!needle) return [];
    const source = (jsonTab === "details" ? detailsJson : menuJson).toLowerCase();
    const matches = [];
    let index = source.indexOf(needle);
    while (index !== -1) {
      matches.push(index);
      index = source.indexOf(needle, index + needle.length);
    }
    return matches;
  })();

  const moveToMatch = (direction) => {
    if (!searchMatches.length) return;
    const next = (activeMatch + direction + searchMatches.length) % searchMatches.length;
    setActiveMatch(next);
    const start = searchMatches[next];
    requestAnimationFrame(() => {
      jsonTextarea.current?.focus();
      jsonTextarea.current?.setSelectionRange(start, start + jsonSearch.trim().length);
    });
  };

  const isDirty =
    menuJson !== initialMenuJson ||
    detailsJson !== initialDetailsJson ||
    Boolean(logoFile) ||
    Boolean(heroFile);

  const handleCancel = () => {
    if (saving) return;
    if (isDirty) {
      setLeaveConfirmOpen(true);
      return;
    }
    navigate("/admin");
  };

  const save = async (event) => {
    event.preventDefault();
    if (!restaurant || saving) return;

    let menuData;
    let detailsData;
    try {
      menuData = JSON.parse(menuJson);
      detailsData = JSON.parse(detailsJson);
    } catch {
      toast.error("Fix the invalid JSON before saving.");
      return;
    }
    if (!menuData || typeof menuData !== "object" || !detailsData || typeof detailsData !== "object" || Array.isArray(detailsData)) {
      toast.error("Menu JSON must be an object or array; restaurant details must be an object.");
      return;
    }

    setSaving(true);
    try {
      let logoUrl = restaurant.logo_url;
      let heroUrl = restaurant.hero_image_url;
      if (logoFile) {
        logoUrl = await uploadRestaurantAsset(restaurant.user_id, restaurant.id, logoFile, "logo");
      }
      if (heroFile) {
        heroUrl = await uploadRestaurantAsset(restaurant.user_id, restaurant.id, heroFile, "hero");
      }

      const client = requireSupabase();
      const updatePayload = {
        logo_url: logoUrl || null,
        hero_image_url: heroUrl || null,
        menu_data: menuData,
        name: detailsData.name ?? restaurant.name,
        tagline: detailsData.tagline ?? null,
        phone: detailsData.phone ?? restaurant.phone,
        address: detailsData.address ?? null,
        currency: detailsData.currency ?? restaurant.currency,
        theme: detailsData.theme ?? restaurant.theme,
        venue: detailsData.venue ?? restaurant.venue,
        is_online: detailsData.is_online ?? restaurant.is_online,
      };
      const { error: rpcError } = await client.rpc("admin_update_restaurant", {
        p_restaurant_id: restaurant.id,
        p_logo_url: updatePayload.logo_url,
        p_hero_image_url: updatePayload.hero_image_url,
        p_menu_data: menuData,
        p_restaurant_data: detailsData,
      });

      // Existing installations may not yet have the latest SQL function.
      // Their admin update policy already permits this direct update.
      if (rpcError?.code === "PGRST202") {
        const { error: directError } = await client
          .from("restaurants")
          .update(updatePayload)
          .eq("id", restaurant.id);
        if (directError) throw directError;
      } else if (rpcError) {
        throw rpcError;
      }

      toast.success("Restaurant changes saved");
      navigate("/admin");
    } catch (err) {
      toast.error(err.message || "Could not save restaurant changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="auth-page"><Spinner size="lg" label="Loading restaurant…" /></div>;
  }

  return (
    <div className="platform admin-edit-page">
      <header className="dashboard-header">
        <button type="button" className="btn btn--ghost btn--sm" onClick={handleCancel} disabled={saving}><ArrowLeft /> Back to admin</button>
        <strong>Editing {restaurant.name}</strong>
      </header>

      <main className="admin-edit-page__main">
        <div className="dashboard-top">
          <div>
            <h1>Edit restaurant assets & menu</h1>
            <p className="auth-muted">Upload the public images and edit the current menu JSON.</p>
          </div>
        </div>

        <form className="admin-edit-form" onSubmit={save}>
          <section className="admin-edit-card">
            <h2>Restaurant images</h2>
            <div className="admin-image-grid">
              <label className="admin-image-upload admin-image-upload--logo">
                <span>Logo</span>
                <div className="admin-image-upload__preview">
                  {logoPreview ? <img src={logoPreview} alt="Logo preview" /> : <span>No logo</span>}
                </div>
                <input type="file" accept="image/*" onChange={selectImage("logo")} disabled={saving} />
                <em><Upload01 /> {logoFile ? logoFile.name : "Upload logo"}</em>
              </label>
              <label className="admin-image-upload">
                <span>Hero photo</span>
                <div className="admin-image-upload__preview admin-image-upload__preview--hero">
                  {heroPreview ? <img src={heroPreview} alt="Hero photo preview" /> : <span>No hero photo</span>}
                </div>
                <input type="file" accept="image/*" onChange={selectImage("hero")} disabled={saving} />
                <em><Upload01 /> {heroFile ? heroFile.name : "Upload hero photo"}</em>
              </label>
            </div>
          </section>

          <section className="admin-edit-card">
            <div className="admin-json-tabs" role="tablist" aria-label="Restaurant JSON editors">
              <button type="button" role="tab" aria-selected={jsonTab === "details"} className={jsonTab === "details" ? "is-active" : ""} onClick={() => { setJsonTab("details"); setActiveMatch(0); }}>Restaurant details</button>
              <button type="button" role="tab" aria-selected={jsonTab === "menu"} className={jsonTab === "menu" ? "is-active" : ""} onClick={() => { setJsonTab("menu"); setActiveMatch(0); }}>Menu</button>
            </div>
            <div className="admin-json-search">
              <label>
                <SearchMd aria-hidden="true" />
                <input
                  type="search"
                  value={jsonSearch}
                  onChange={(event) => {
                    setJsonSearch(event.target.value);
                    setActiveMatch(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      moveToMatch(event.shiftKey ? -1 : 1);
                    }
                  }}
                  placeholder="Search in JSON…"
                  aria-label={`Search in ${jsonTab === "details" ? "restaurant details" : "menu"} JSON`}
                  disabled={saving}
                />
              </label>
              {jsonSearch.trim() && (
                <div className="admin-json-search__matches" aria-live="polite">
                  <span>{searchMatches.length ? `${activeMatch + 1} of ${searchMatches.length}` : "No matches"}</span>
                  <button type="button" onClick={() => moveToMatch(-1)} disabled={saving || !searchMatches.length}>Previous</button>
                  <button type="button" onClick={() => moveToMatch(1)} disabled={saving || !searchMatches.length}>Next</button>
                </div>
              )}
            </div>
            {jsonTab === "details" ? (
              <label className="admin-json-field">
                <span>Restaurant details JSON</span>
                <small>Includes location, contact details, venue data, theme, and visibility.</small>
                <textarea ref={jsonTextarea} className="admin-json-field__editor" data-json-editor="true" value={detailsJson} onChange={(event) => { setDetailsJson(event.target.value); setActiveMatch(0); }} spellCheck="false" disabled={saving} />
              </label>
            ) : (
              <label className="admin-json-field">
                <span>Menu JSON</span>
                <textarea ref={jsonTextarea} className="admin-json-field__editor" data-json-editor="true" value={menuJson} onChange={(event) => { setMenuJson(event.target.value); setActiveMatch(0); }} spellCheck="false" disabled={saving} />
              </label>
            )}
          </section>

          <div className="admin-edit-form__actions">
            <button type="button" className="btn btn--ghost" onClick={handleCancel} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              <Save01 /> <SpinnerButton loading={saving}>{saving ? "Saving…" : "Save changes"}</SpinnerButton>
            </button>
          </div>
        </form>
      </main>

      {leaveConfirmOpen && (
        <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="discard-changes-title">
          <button type="button" className="confirm-modal__backdrop" aria-label="Keep editing" onClick={() => setLeaveConfirmOpen(false)} />
          <div className="confirm-modal__panel">
            <div className="confirm-modal__head"><h2 id="discard-changes-title">Discard changes?</h2></div>
            <p className="confirm-modal__text">You have unsaved edits to the images or JSON. Do you want to discard them?</p>
            <div className="confirm-modal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setLeaveConfirmOpen(false)}>Keep editing</button>
              <button type="button" className="btn btn--danger" onClick={() => navigate("/admin")}>Discard changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
