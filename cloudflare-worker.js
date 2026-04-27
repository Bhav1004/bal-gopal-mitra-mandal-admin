export default {
  async fetch(request, env) {

    // ── CORS headers (required for browser requests from admin panel) ─────────
    const corsHeaders = {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Handle preflight (browser sends this before every POST)
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405, headers: corsHeaders });
    }

    const body = await request.json();

    // 1. Create JWT
    const header = { alg: "RS256", typ: "JWT" };
    const now    = Math.floor(Date.now() / 1000);
    const payload = {
      iss:   env.CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud:   "https://oauth2.googleapis.com/token",
      exp:   now + 3600,
      iat:   now
    };

    function base64url(input) {
      return btoa(JSON.stringify(input))
        .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }

    const encodedHeader  = base64url(header);
    const encodedPayload = base64url(payload);
    const data           = `${encodedHeader}.${encodedPayload}`;

    // 2. Import private key
    const key = await crypto.subtle.importKey(
      "pkcs8",
      str2ab(env.PRIVATE_KEY.replace(/\\n/g, "\n")),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(data)
    );

    const jwt = data + "." +
      btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    // 3. Exchange JWT for access token
    const tokenRes  = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return new Response(JSON.stringify(tokenData), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // 4. Send FCM message
    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${env.PROJECT_ID}/messages:send`,
      {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: {
            token:        body.token,
            notification: { title: body.title, body: body.body },
            android: {
              priority: "high",
              notification: {
                channel_id:    "mandal_channel",
                sound:         "default",
                default_sound: true
              }
            }
          }
        })
      }
    );

    // Return FCM response WITH CORS headers
    return new Response(await fcmRes.text(), {
      status:  fcmRes.status,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

function str2ab(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer;
}
