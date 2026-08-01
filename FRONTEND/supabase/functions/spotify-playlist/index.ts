<<<<<<< Updated upstream
=======
import { createClient } from "npm:@supabase/supabase-js@2";

>>>>>>> Stashed changes
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

<<<<<<< Updated upstream
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
  return await res.json();
}

async function supabaseQuery(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

=======
>>>>>>> Stashed changes
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, playlist_id, track_uri, pair_id } = await req.json();

    const config = await supabaseQuery(
      "spotify_config",
      `select=access_token,spotify_playlist_id&pair_id=eq.${pair_id}&limit=1`
    );

<<<<<<< Updated upstream
    if (!config?.access_token) {
=======
    const encryptionKey = Deno.env.get("SPOTIFY_TOKEN_ENCRYPTION_KEY");

    if (!encryptionKey) {
      return new Response(
        JSON.stringify({ error: "server_config_error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: config, error: fetchError } = await supabase
      .from("spotify_config")
      .select("access_token, refresh_token, spotify_playlist_id")
      .eq("pair_id", pair_id)
      .single();

    if (fetchError || !config?.access_token) {
>>>>>>> Stashed changes
      return new Response(
        JSON.stringify({ error: "no_config" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

<<<<<<< Updated upstream
    const accessToken = await supabaseRpc("decrypt_token", {
=======
    const { data: accessToken } = await supabase.rpc("decrypt_token", {
>>>>>>> Stashed changes
      p_encrypted: config.access_token,
      p_key: ENCRYPTION_KEY,
    });

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "token_decrypt_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetPlaylistId = playlist_id || config.spotify_playlist_id;

    if (action === "get_tracks") {
      let allTracks: any[] = [];
      let url = `https://api.spotify.com/v1/playlists/${targetPlaylistId}/tracks?limit=100`;

      while (url) {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: `spotify_${response.status}` }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const data = await response.json();
        const tracks = data.items
          ?.filter((item: any) => item.track && !item.track.is_local)
          .map((item: any) => ({
            uri: item.track.uri,
            name: item.track.name,
            artist: item.track.artists[0]?.name || "Unknown",
            albumArt: item.track.album?.images?.[0]?.url || null,
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
        `https://api.spotify.com/v1/playlists/${targetPlaylistId}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [track_uri] }),
        }
      );
      return new Response(
        JSON.stringify({ success: response.ok }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "remove_track") {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${targetPlaylistId}/tracks`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tracks: [{ uri: track_uri }] }),
        }
      );
      return new Response(
        JSON.stringify({ success: response.ok }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "invalid_action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("spotify-playlist error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
