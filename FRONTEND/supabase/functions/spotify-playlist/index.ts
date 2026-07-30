import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, playlist_id, track_uri, pair_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const encryptionKey = Deno.env.get("SPOTIFY_TOKEN_ENCRYPTION_KEY")!;

    // Fetch spotify_config for this pair
    const { data: config, error: fetchError } = await supabase
      .from("spotify_config")
      .select("access_token, refresh_token, spotify_playlist_id")
      .eq("pair_id", pair_id)
      .single();

    if (fetchError || !config?.access_token) {
      return new Response(
        JSON.stringify({ error: "no_config", error_description: "No Spotify config found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decrypt access_token
    const { data: accessToken } = await supabase.rpc("decrypt_token", {
      p_encrypted: config.access_token,
      p_key: encryptionKey,
    });

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "token_decrypt_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetPlaylistId = playlist_id || config.spotify_playlist_id;

    if (action === "get_tracks") {
      // Fetch all tracks with pagination (Spotify returns max 100 per request)
      let allTracks: any[] = [];
      let url = `https://api.spotify.com/v1/playlists/${targetPlaylistId}/tracks?limit=100`;

      while (url) {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          if (response.status === 404) {
            return new Response(
              JSON.stringify({ error: "playlist_not_found" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status === 401) {
            return new Response(
              JSON.stringify({ error: "token_expired" }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw new Error(`Spotify API error: ${response.status}`);
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

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Spotify add_track error: ${JSON.stringify(errData)}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
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

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Spotify remove_track error: ${JSON.stringify(errData)}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
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
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
