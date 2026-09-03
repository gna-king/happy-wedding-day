const ALLOWED_ORIGIN = "https://gna-king.github.io";

function cors() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-File-Name",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request, env) {
    const headers = cors();
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      let r2BindingOk = false;
      try {
        await env.BUCKET.list({ limit: 1 });
        r2BindingOk = true;
      } catch {}
      return Response.json({ ok: true, hasBucketBinding: !!env.BUCKET, r2BindingOk });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return new Response("Not allowed", { status: 405, headers });
    }
    const origin = request.headers.get("Origin");
    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403, headers });
    }

    try {
      const contentType = request.headers.get("Content-Type") || "application/octet-stream";
      if (!contentType.startsWith("image/")) {
        return Response.json({ success:false, error:"image_only" }, { status:400, headers });
      }

      const rawName = decodeURIComponent(request.headers.get("X-File-Name") || "photo");
      const extMatch = rawName.match(/\.([a-zA-Z0-9]{1,10})$/);
      const ext = extMatch ? "." + extMatch[1].toLowerCase() : "";
      const date = new Date().toISOString().slice(0,10);
      const key = "wedding-photos/" + date + "/" + Date.now() + "-" + crypto.randomUUID() + ext;

      await env.BUCKET.put(key, request.body, {
        httpMetadata: { contentType },
        customMetadata: { originalName: rawName.slice(0, 500) }
      });

      return Response.json({ success:true, key }, { headers });
    } catch (e) {
      console.error(e);
      return Response.json({ success:false, error:"upload_failed" }, { status:500, headers });
    }
  }
};