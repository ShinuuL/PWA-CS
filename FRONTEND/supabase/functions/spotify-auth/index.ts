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
    const { action, code, redirect_uri, pair_id, code_verifier } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const spotifyClientId = Deno.env.get("SPOTIFY_CLIENT_ID")!;
    const spotifyClientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET")!;
    const encryptionKey = Deno.env.get("SPOTIFY_TOKEN_ENCRYPTION_KEY")!;

    if (action === "exchange") {
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
      });

      if (code_verifier) {
        params.append("code_verifier", code_verifier);
      }

      const tokenResponse = await fetch(
        "https://accounts.spotify.com/api/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`,
          },
          body: params.toString(),
        }
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return new Response(
          JSON.stringify({ error: tokenData.error, error_description: tokenData.error_description }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      const token_expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

      const { data: encAccess } = await supabase.rpc("encrypt_token", {
        p_token: access_token,
        p_key: encryptionKey,
      });
      const { data: encRefresh } = await supabase.rpc("encrypt_token", {
        p_token: refresh_token,
        p_key: encryptionKey,
      });

      const { error: upsertError } = await supabase
        .from("spotify_config")
        .upsert(
          {
            pair_id,
            access_token: encAccess,
            refresh_token: encRefresh,
            token_expires_at,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "pair_id" }
        );

      if (upsertError) throw upsertError;

      return new Response(
        JSON.stringify({ access_token, expires_in }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "refresh") {
      const { data: config, error: fetchError } = await supabase
        .from("spotify_config")
        .select("refresh_token")
        .eq("pair_id", pair_id)
        .single();

      if (fetchError || !config?.refresh_token) {
        return new Response(
          JSON.stringify({ error: "no_config", error_description: "No Spotify config found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: decryptedRefresh } = await supabase.rpc("decrypt_token", {
        p_encrypted: config.refresh_token,
        p_key: encryptionKey,
      });

      const tokenResponse = await fetch(
        "https://accounts.spotify.com/api/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: decryptedRefresh,
          }).toString(),
        }
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.error === "invalid_grant") {
        await supabase
          .from("spotify_config")
          .delete()
          .eq("pair_id", pair_id);

        return new Response(
          JSON.stringify({ error: "reconnect_required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (tokenData.error) {
        return new Response(
          JSON.stringify({ error: tokenData.error, error_description: tokenData.error_description }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      const newRefreshToken = refresh_token || decryptedRefresh;
      const token_expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

      const { data: encAccess } = await supabase.rpc("encrypt_token", {
        p_token: access_token,
        p_key: encryptionKey,
      });
      const { data: encRefresh } = await supabase.rpc("encrypt_token", {
        p_token: newRefreshToken,
        p_key: encryptionKey,
      });

      await supabase
        .from("spotify_config")
        .update({
          access_token: encAccess,
          refresh_token: encRefresh,
          token_expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq("pair_id", pair_id);

      return new Response(
        JSON.stringify({ access_token, expires_in }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "invalid_action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("spotify-auth error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
