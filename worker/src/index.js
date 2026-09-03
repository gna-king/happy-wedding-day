import { AwsClient } from "aws4fetch";

const BUCKET = "wedding-photos";
const ALLOWED_ORIGIN = "https://gna-king.github.io";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders();

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Not allowed", { status: 405, headers: cors });
    }

    const origin = request.headers.get("Origin");
    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403, headers: cors });
    }

    try {
      const body = await request.json();
      const fileName = String(body.fileName || "photo");
      const contentType = String(body.contentType || "application/octet-stream");

      if (!contentType.startsWith("image/")) {
        return Response.json(
          { success: false, error: "image_only" },
          { status: 400, headers: cors }
        );
      }

      const extMatch = fileName.match(/\.([a-zA-Z0-9]{1,10})$/);
      const ext = extMatch ? "." + extMatch[1].toLowerCase() : "";
      const date = new Date().toISOString().slice(0, 10);
      const key =
        "wedding-photos/" +
        date +
        "/" +
        Date.now() +
        "-" +
        crypto.randomUUID() +
        ext;

      const objectPath = key
        .split("/")
        .map(encodeURIComponent)
        .join("/");

      const endpoint =
        "https://" +
        env.R2_ACCOUNT_ID +
        ".r2.cloudflarestorage.com/" +
        BUCKET +
        "/" +
        objectPath;

      const signer = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        service: "s3",
        region: "auto",
      });

      const url = new URL(endpoint);
      url.searchParams.set("X-Amz-Expires", "600");

      const signed = await signer.sign(
        new Request(url, { method: "PUT" }),
        { aws: { signQuery: true } }
      );

      return Response.json(
        { success: true, uploadUrl: signed.url, key },
        {
          headers: {
            ...cors,
            "Cache-Control": "no-store",
          },
        }
      );
    } catch (error) {
      console.error(error);
      return Response.json(
        { success: false, error: "presign_failed" },
        { status: 500, headers: cors }
      );
    }
  },
};
