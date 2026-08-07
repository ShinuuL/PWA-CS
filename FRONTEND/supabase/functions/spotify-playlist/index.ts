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
  // PostgREST wraps scalar function returns in an array — extract the first element
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

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { action, playlist_id, track_uri, pair_id } = body;

    console.log("[spotify-playlist] request received", {
      action,
      pair_id,
      playlist_id: playlist_id || "(none)",
      has_track_uri: !!track_uri,
      has_encryption_key: !!ENCRYPTION_KEY,
      encryption_key_length: ENCRYPTION_KEY?.length,
    });

    const config = await supabaseQuery(
      "spotify_config",
      `select=access_token,refresh_token,spotify_playlist_id&pair_id=eq.${pair_id}&limit=1`
    );

    console.log("[spotify-playlist] config query result", {
      found: !!config,
      has_access_token: !!config?.access_token,
      access_token_length: config?.access_token?.length,
      has_refresh_token: !!config?.refresh_token,
      spotify_playlist_id: config?.spotify_playlist_id || "(null)",
    });

    if (!config) {
      console.error("[spotify-playlist] no config row found for pair_id:", pair_id);
      return new Response(
        JSON.stringify({ error: "no_config", detail: "no spotify_config row for this pair" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!config.access_token) {
      console.error("[spotify-playlist] config exists but access_token is null/empty");
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

    console.log("[spotify-playlist] decrypt result", {
      success: !!accessToken,
      token_length: accessToken?.length,
      decrypt_error: decryptError,
    });

    if (!accessToken) {
      console.error("[spotify-playlist] token decryption failed", { decryptError });
      return new Response(
        JSON.stringify({ error: "token_decrypt_failed", detail: decryptError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetPlaylistId = playlist_id || config.spotify_playlist_id;

    if (!targetPlaylistId) {
      console.error("[spotify-playlist] no playlist_id provided and none in config");
      return new Response(
        JSON.stringify({ error: "no_playlist_id", detail: "no playlist_id in request or config" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[spotify-playlist] proceeding with action", {
      action,
      targetPlaylistId,
      token_length: accessToken.length,
    });

    if (action === "get_tracks") {
      console.log("[spotify-playlist] get_tracks started", { playlistId: targetPlaylistId });
      let allTracks: any[] = [];
      let url = `https://api.spotify.com/v1/playlists/${targetPlaylistId}/items?limit=100`;
      let pageCount = 0;

      while (url) {
        pageCount++;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log("[spotify-playlist] Spotify API response", {
          page: pageCount,
          status: response.status,
          ok: response.ok,
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.error("[spotify-playlist] Spotify API error", {
            status: response.status,
            body: errBody.substring(0, 500),
          });
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

        console.log("[spotify-playlist] page fetched", {
          page: pageCount,
          tracksInPage: tracks.length,
          totalSoFar: allTracks.length,
          hasNext: !!data.next,
        });
      }

      console.log("[spotify-playlist] get_tracks completed", {
        totalTracks: allTracks.length,
        elapsed: Date.now() - startTime,
      });

      return new Response(
        JSON.stringify({ tracks: allTracks }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "add_track") {
      console.log("[spotify-playlist] add_track", { playlistId: targetPlaylistId, track_uri });
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
      console.log("[spotify-playlist] add_track result", {
        status: response.status,
        ok: response.ok,
        body: respBody.substring(0, 300),
      });
      return new Response(
        JSON.stringify({ success: response.ok, status: response.status, detail: respBody }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "remove_track") {
      console.log("[spotify-playlist] remove_track", { playlistId: targetPlaylistId, track_uri });
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
      console.log("[spotify-playlist] remove_track result", {
        status: response.status,
        ok: response.ok,
        body: respBody.substring(0, 300),
      });
      return new Response(
        JSON.stringify({ success: response.ok, status: response.status, detail: respBody }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.error("[spotify-playlist] invalid action:", action);
    return new Response(
      JSON.stringify({ error: "invalid_action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[spotify-playlist] unhandled error", {
      message: error.message,
      stack: error.stack,
      elapsed: Date.now() - startTime,
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
