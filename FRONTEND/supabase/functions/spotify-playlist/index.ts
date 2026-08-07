const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENCRYPTION_KEY = Deno.env.get("SPOTIFY_TOKEN_ENCRYPTION_KEY")!;

async function supabaseRpc(fn: string, params: Record<string, string>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(params),
  });
  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

async function supabaseQuery(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, playlist_id, track_uri, pair_id } = body;

    const config = await supabaseQuery(
      "spotify_config",
      `select=access_token,refresh_token,spotify_playlist_id&pair_id=eq.${pair_id}&limit=1`
    );

    if (!config) {
      return new Response(
        JSON.stringify({ error: "no_config", detail: "no spotify_config row for this pair" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!config.access_token) {
      return new Response(
        JSON.stringify({ error: "no_config", detail: "access_token column is null" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken: string | null = null;
    let decryptError: string | null = null;

    try {
      accessToken = await supabaseRpc("decrypt_token", {
        p_encrypted: config.access_token,
        p_key: ENCRYPTION_KEY,
      });
    } catch (e) {
      decryptError = e.message;
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "token_decrypt_failed", detail: decryptError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetPlaylistId = playlist_id || config.spotify_playlist_id;

    if (!targetPlaylistId) {
      return new Response(
        JSON.stringify({ error: "no_playlist_id", detail: "no playlist_id in request or config" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_tracks") {
      let allTracks: any[] = [];
      let url = `https://api.spotify.com/v1/playlists/${targetPlaylistId}/items?limit=100`;

      while (url) {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          const errBody = await response.text();
          return new Response(
            JSON.stringify({ error: `spotify_${response.status}`, detail: errBody }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const data = await response.json();
        const tracks = data.items
          ?.filter((item: any) => item.item && !item.item.is_local)
          .map((item: any) => ({
            uri: item.item.uri,
            name: item.item.name,
            artist: item.item.artists[0]?.name || "Unknown",
            albumArt: item.item.album?.images?.[0]?.url || null,
          })) || [];

        allTracks = allTracks.concat(tracks);
        url = data.next || null;
      }

      return new Response(
        JSON.stringify({ tracks: allTracks }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "add_track") {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${targetPlaylistId}/items`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [track_uri] }),
        }
      );
      const respBody = await response.text();
      return new Response(
        JSON.stringify({ success: response.ok, status: response.status, detail: respBody }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "remove_track") {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${targetPlaylistId}/items`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: [{ uri: track_uri }] }),
        }
      );
      const respBody = await response.text();
      return new Response(
        JSON.stringify({ success: response.ok, status: response.status, detail: respBody }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "invalid_action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[spotify-playlist] error", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
