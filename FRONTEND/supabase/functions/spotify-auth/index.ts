import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.8";
import { authorizePair, readBody, HttpError, errorResponse } from "../_shared/security.js";

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
    const { action, code, redirect_uri, pair_id, code_verifier } = await readBody(req);
    await authorizePair(req, pair_id, createClient, (key) => Deno.env.get(key));
    if (!["exchange", "refresh"].includes(action)) throw new HttpError(400, "invalid_action");
    if (action === "exchange" && (typeof code !== "string" || !code || code.length > 4096 ||
        typeof redirect_uri !== "string" || !/^https?:\/\//.test(redirect_uri) ||
        (code_verifier !== undefined && (typeof code_verifier !== "string" || !/^[A-Za-z0-9._~-]{43,128}$/.test(code_verifier))))) {
      throw new HttpError(400, "invalid_exchange");
    }

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

      if (!tokenResponse.ok || typeof access_token !== "string" || typeof refresh_token !== "string" || !Number.isFinite(expires_in)) throw new Error("invalid_token_response");
      const { data: encAccess, error: accessError } = await supabase.rpc("encrypt_token", {
        p_token: access_token,
        p_key: encryptionKey,
      });
      const { data: encRefresh, error: refreshError } = await supabase.rpc("encrypt_token", {
        p_token: refresh_token,
        p_key: encryptionKey,
      });

      if (accessError || refreshError || !encAccess || !encRefresh) throw new Error("token_encryption_failed");

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

      const { data: decryptedRefresh, error: decryptError } = await supabase.rpc("decrypt_token", {
        p_encrypted: config.refresh_token,
        p_key: encryptionKey,
      });
      if (decryptError || typeof decryptedRefresh !== "string" || !decryptedRefresh) throw new Error("token_decryption_failed");

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
        const { error: deleteError } = await supabase
          .from("spotify_config")
          .delete()
          .eq("pair_id", pair_id);
        if (deleteError) throw deleteError;

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
      if (!tokenResponse.ok || typeof access_token !== "string" || !Number.isFinite(expires_in) || (refresh_token !== undefined && typeof refresh_token !== "string")) throw new Error("invalid_token_response");
      const newRefreshToken = refresh_token || decryptedRefresh;
      const token_expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

      const { data: encAccess, error: accessError } = await supabase.rpc("encrypt_token", {
        p_token: access_token,
        p_key: encryptionKey,
      });
      const { data: encRefresh, error: refreshError } = await supabase.rpc("encrypt_token", {
        p_token: newRefreshToken,
        p_key: encryptionKey,
      });

      if (accessError || refreshError || !encAccess || !encRefresh) throw new Error("token_encryption_failed");
      const { error: updateError } = await supabase
        .from("spotify_config")
        .update({
          access_token: encAccess,
          refresh_token: encRefresh,
          token_expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq("pair_id", pair_id);
      if (updateError) throw updateError;

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
    return errorResponse(error, corsHeaders);
  }
});
