import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-upload-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function json(body: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = request.headers.get("x-admin-upload-token");
  if (!token) return json({ error: "Admin upload token is required" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return json({ error: "Server configuration is incomplete" }, 500);

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const { data: session, error: sessionError } = await admin
    .from("admin_upload_sessions")
    .select("token")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (sessionError) return json({ error: `Could not verify admin upload session: ${sessionError.message}` }, 500);
  if (!session) return json({ error: "Admin upload session has expired. Please sign in again." }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid upload request" }, 400);
  }
  const userId = String(payload.userId || "");
  const restaurantId = String(payload.restaurantId || "");
  const kind = String(payload.kind || "");
  const fileType = String(payload.fileType || "");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuid.test(userId) || !uuid.test(restaurantId) || !["logo", "hero"].includes(kind)) {
    return json({ error: "Invalid image upload request" }, 400);
  }
  if (!imageTypes.has(fileType)) {
    return json({ error: "Upload a JPG, PNG, WebP, or GIF image" }, 400);
  }

  const { data: restaurant, error: restaurantError } = await admin
    .from("restaurants")
    .select("id, user_id")
    .eq("id", restaurantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (restaurantError || !restaurant) return json({ error: "Restaurant not found" }, 404);

  const path = `${userId}/${restaurantId}/${kind}-${crypto.randomUUID()}.${extensions[fileType]}`;
  const { data: signedUpload, error: signedUploadError } = await admin.storage
    .from("restaurant-assets")
    .createSignedUploadUrl(path);
  if (signedUploadError || !signedUpload) {
    return json({ error: signedUploadError?.message || "Could not create signed upload URL" }, 500);
  }

  return json({ path: signedUpload.path, token: signedUpload.token });
});
