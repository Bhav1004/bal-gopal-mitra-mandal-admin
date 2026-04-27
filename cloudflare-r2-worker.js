/**
 * Cloudflare Worker — Gallery Upload / Delete via R2
 *
 * Environment variables (set in Worker Settings → Variables & Bindings):
 *   R2 Binding:   GALLERY_BUCKET  → your R2 bucket  (bgmm-gallery)
 *   Text var:     R2_PUBLIC_URL   → e.g. https://pub-xxxxxxxxxxxx.r2.dev
 *
 * Endpoints:
 *   POST /          multipart/form-data { file, albumId }   → upload, returns { url, path }
 *   POST /delete    application/json    { path }            → delete file from R2
 *   OPTIONS /       (any)                                   → CORS preflight
 */

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request, env) {

    // ── CORS preflight ────────────────────────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405, headers: CORS });
    }

    const url = new URL(request.url);

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (url.pathname === "/delete") {
      try {
        const { path } = await request.json();
        if (!path) return json({ error: "path required" }, 400);
        await env.GALLERY_BUCKET.delete(path);
        return json({ ok: true });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    // ── UPLOAD ────────────────────────────────────────────────────────────────
    try {
      const formData = await request.formData();
      const file     = formData.get("file");
      const albumId  = formData.get("albumId") || "default";

      if (!file || typeof file === "string") {
        return json({ error: "No file in request" }, 400);
      }

      // Build a unique storage path
      const ext      = (file.name || "img").split(".").pop().toLowerCase();
      const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path     = `gallery/${albumId}/${safeName}`;

      // Write to R2
      await env.GALLERY_BUCKET.put(path, file.stream(), {
        httpMetadata: { contentType: file.type || "image/jpeg" }
      });

      const publicUrl = `${env.R2_PUBLIC_URL}/${path}`;
      return json({ url: publicUrl, path });

    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS }
  });
}
