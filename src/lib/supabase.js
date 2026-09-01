import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const SUPABASE_CONFIG_ERROR =
  "Supabase is not configured. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project (Settings → API).";

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
  return data.publicUrl;
}
