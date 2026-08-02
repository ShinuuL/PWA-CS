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
  return result;
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
    const debug: string[] = [];
    debug.push(`action=${action} pair_id=${pair_id} playlist_id=${playlist_id}`);

    const config = await supabaseQuery(
      "spotify_config",
      `select=access_token,spotify_playlist_id&pair_id=eq.${pair_id}&limit=1`
    );
    debug.push(`config_found=${!!config} has_access=${!!config?.access_token} db_playlist=${config?.spotify_playlist_id || "null"}`);

    if (!config?.access_token) {
      debug.push("EXIT: no_config");
      return new Response(
        JSON.stringify({ error: "no_config", _debug: debug }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await supabaseRpc("decrypt_token", {
      p_encrypted: config.access_token,
      p_key: ENCRYPTION_KEY,
    });

    if (!accessToken) {
      debug.push("EXIT: token_decrypt_failed");
      return new Response(
        JSON.stringify({ error: "token_decrypt_failed", _debug: debug }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    debug.push(`token_len=${String(accessToken).length}`);

    if (action === "test_token") {
      const meRes = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const meData = await meRes.json();
      debug.push(`me_status=${meRes.status} id=${meData.id || "none"} display_name=${meData.display_name || "none"}`);

      const scopeRes = await fetch("https://api.spotify.com/v1/me/playlists?limit=5", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const scopeData = await scopeRes.json();
      debug.push(`playlists_status=${scopeRes.status} count=${scopeData.items?.length || 0}`);

      return new Response(
        JSON.stringify({
          me: { id: meData.id, display_name: meData.display_name },
          playlists: scopeData.items?.map((p: any) => ({ id: p.id, name: p.name, owner: p.owner?.id })) || [],
          me_status: meRes.status,
          playlists_status: scopeRes.status,
          _debug: debug,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetPlaylistId = playlist_id || config.spotify_playlist_id;

    if (!targetPlaylistId) {
      debug.push("EXIT: no_playlist_id");
      return new Response(
        JSON.stringify({ error: "no_playlist_id", _debug: debug }),
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
          debug.push(`spotify_get_tracks_${response.status}: ${errBody.substring(0, 200)}`);
          return new Response(
            JSON.stringify({ error: `spotify_${response.status}`, detail: errBody, _debug: debug }),
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

      debug.push(`get_tracks_total=${allTracks.length}`);
      return new Response(
        JSON.stringify({ tracks: allTracks, _debug: debug }),
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
      debug.push(`add_track_spotify_${response.status}`);
      return new Response(
        JSON.stringify({ success: response.ok, status: response.status, detail: respBody, _debug: debug }),
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
      debug.push(`remove_track_spotify_${response.status}`);
      return new Response(
        JSON.stringify({ success: response.ok, status: response.status, detail: respBody, _debug: debug }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    debug.push("EXIT: invalid_action");
    return new Response(
      JSON.stringify({ error: "invalid_action", _debug: debug }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, _debug: [`CAUGHT: ${error.message}`] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
