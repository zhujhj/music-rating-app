// Deno Edge Function: proxies Spotify track search using the Client
// Credentials flow. The Spotify client secret only ever lives here as an
// Edge Function secret — it's never shipped in the mobile app bundle.
//
// Deploy: supabase functions deploy spotify-search
// Secrets: supabase secrets set SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=...

const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID")!;
const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cached in module scope: survives across warm invocations, re-minted on
// cold start. No persistence needed at this traffic scale.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const basicAuth = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    // Refresh a minute early to avoid edge-of-expiry failures.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { q } = await req.json();
    if (!q || typeof q !== "string") {
      return new Response(JSON.stringify({ error: "Missing query 'q'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getAccessToken();
    // Spotify caps the `limit` param at 10 for newly-created (development
    // mode) apps, even though the documented general max is 50.
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`;
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!searchResponse.ok) {
      throw new Error(`Spotify search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const tracks = (searchData.tracks?.items ?? []).map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((a: any) => ({ name: a.name })),
      album: {
        name: track.album.name,
        images: track.album.images,
      },
      external_urls: { spotify: track.external_urls.spotify },
    }));

    return new Response(JSON.stringify({ tracks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
