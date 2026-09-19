import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const SUPABASE_CONFIG_ERROR = import.meta.env.PROD
  ? "Supabase is not configured on Vercel. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY under Project Settings → Environment Variables, then redeploy."
  : "Supabase is not configured. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project (Settings → API).";

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.error(`[MenuCraft] ${SUPABASE_CONFIG_ERROR}`);
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }
  return supabase;
}

export const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1920&q=80";

export async function uploadRestaurantAsset(userId, restaurantId, file, kind) {
  const client = requireSupabase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/${restaurantId}/${kind}.${ext}`;

  const { error: uploadError } = await client.storage
    .from("restaurant-assets")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = client.storage.from("restaurant-assets").getPublicUrl(path);
  // The asset path stays stable, so give each successful replacement a distinct
  // URL. Otherwise a browser or the storage CDN can keep showing the old image.
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Uploads an asset through the server-side admin endpoint. */
export async function uploadAdminRestaurantAsset(userId, restaurantId, file, kind, uploadToken) {
  if (!uploadToken) {
    throw new Error("Your admin session has expired. Please sign in again.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Choose an image smaller than 5 MB.");
  }

  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("admin-upload-asset", {
    body: { userId, restaurantId, kind, fileType: file.type },
    headers: { "x-admin-upload-token": uploadToken },
  });

  if (error) {
    if (error.name === "FunctionsFetchError") {
      throw new Error(
        "Admin image upload is not deployed yet. Deploy the admin-upload-asset Supabase Edge Function, then sign in again.",
      );
    }
    if (error.context instanceof Response) {
      const body = await error.context.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
  if (!data?.path || !data?.token) {
    throw new Error("The admin upload did not return a signed upload URL.");
  }

  const { error: uploadError } = await client.storage
    .from("restaurant-assets")
    .uploadToSignedUrl(data.path, data.token, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: publicUrl } = client.storage
    .from("restaurant-assets")
    .getPublicUrl(data.path);
  return `${publicUrl.publicUrl}?v=${Date.now()}`;
}
