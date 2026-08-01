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
const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID")!;
const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET")!;
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
  const data = await res.json();
  return { data, error: res.ok ? null : data };
}

async function supabaseQuery(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=representation",
    },
  });
  const data = await res.json();
  return { data: Array.isArray(data) ? data[0] : data, error: res.ok ? null : data };
}

async function supabaseUpsert(table: string, body: Record<string, unknown>, onConflict?: string) {
  const params = onConflict ? `?on_conflict=${onConflict}` : "";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(body),
  });
  return { error: res.ok ? null : await res.json() };
}

async function supabaseUpdate(table: string, body: Record<string, unknown>, filter: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return { error: res.ok ? null : await res.json() };
}

async function supabaseDelete(table: string, filter: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  return { error: res.ok ? null : await res.json() };
}

async function spotifyTokenExchange(params: URLSearchParams) {
  // PKCE flows use client_id in body, NOT Basic Auth header
  params.set("client_id", SPOTIFY_CLIENT_ID);
  return fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
}

=======
>>>>>>> Stashed changes
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, code, code_verifier, redirect_uri, pair_id } = await req.json();
<<<<<<< Updated upstream
    console.log("spotify-auth action:", action, "pair:", pair_id);

    if (action === "exchange") {
      if (!code || !redirect_uri) {
=======
    console.log("Request action:", action, "pair_id:", pair_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const spotifyClientId = Deno.env.get("SPOTIFY_CLIENT_ID");
    const spotifyClientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
    const encryptionKey = Deno.env.get("SPOTIFY_TOKEN_ENCRYPTION_KEY");

    if (!spotifyClientId || !spotifyClientSecret || !encryptionKey) {
      console.error("Missing env vars:", {
        clientId: !!spotifyClientId,
        clientSecret: !!spotifyClientSecret,
        encryptionKey: !!encryptionKey,
      });
      return new Response(
        JSON.stringify({ error: "server_config_error", error_description: "Missing Spotify env vars" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "exchange") {
      if (!code || !redirect_uri) {
        return new Response(
          JSON.stringify({ error: "invalid_params", error_description: "Missing code or redirect_uri" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenBody = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        ...(code_verifier ? { code_verifier } : {}),
      });

      const tokenResponse = await fetch(
        "https://accounts.spotify.com/api/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`,
          },
          body: tokenBody.toString(),
        }
      );

      const tokenData = await tokenResponse.json();
      console.log("Spotify token status:", tokenResponse.status);

      if (tokenData.error) {
        console.error("Spotify exchange failed:", tokenData.error, tokenData.error_description);
>>>>>>> Stashed changes
        return new Response(
          JSON.stringify({ error: "missing_params" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenRes = await spotifyTokenExchange(new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        ...(code_verifier ? { code_verifier } : {}),
      }));

      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        // invalid_grant = code already used or expired — tell frontend to re-auth
        const status = tokenData.error === "invalid_grant" ? 401 : 400;
        return new Response(
          JSON.stringify(tokenData),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      const token_expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

<<<<<<< Updated upstream
      const { data: encAccess } = await supabaseRpc("encrypt_token", {
=======
      const { data: encAccess, error: encAccessErr } = await supabase.rpc("encrypt_token", {
>>>>>>> Stashed changes
        p_token: access_token,
        p_key: ENCRYPTION_KEY,
      });
<<<<<<< Updated upstream
      const { data: encRefresh } = await supabaseRpc("encrypt_token", {
=======
      console.log("encrypt access:", encAccess ? "OK" : "FAIL", encAccessErr?.message || "");

      const { data: encRefresh, error: encRefreshErr } = await supabase.rpc("encrypt_token", {
>>>>>>> Stashed changes
        p_token: refresh_token,
        p_key: ENCRYPTION_KEY,
      });
      console.log("encrypt refresh:", encRefresh ? "OK" : "FAIL", encRefreshErr?.message || "");

<<<<<<< Updated upstream
      await supabaseUpsert("spotify_config", {
        pair_id,
        access_token: encAccess,
        refresh_token: encRefresh,
        token_expires_at,
        updated_at: new Date().toISOString(),
      }, "pair_id");

      console.log("exchange OK:", pair_id);
=======
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

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        throw upsertError;
      }

      console.log("Exchange OK for pair:", pair_id);
>>>>>>> Stashed changes
      return new Response(
        JSON.stringify({ access_token, expires_in }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "refresh") {
<<<<<<< Updated upstream
      const { data: config } = await supabaseQuery(
        "spotify_config",
        `select=refresh_token&pair_id=eq.${pair_id}&limit=1`
      );
=======
      if (!pair_id) {
        return new Response(
          JSON.stringify({ error: "invalid_params", error_description: "Missing pair_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: config, error: fetchError } = await supabase
        .from("spotify_config")
        .select("refresh_token")
        .eq("pair_id", pair_id)
        .single();
>>>>>>> Stashed changes

      if (!config?.refresh_token) {
        return new Response(
          JSON.stringify({ error: "no_config" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

<<<<<<< Updated upstream
      const { data: decryptedRefresh } = await supabaseRpc("decrypt_token", {
=======
      const { data: decryptedRefresh } = await supabase.rpc("decrypt_token", {
>>>>>>> Stashed changes
        p_encrypted: config.refresh_token,
        p_key: ENCRYPTION_KEY,
      });

      if (!decryptedRefresh) {
<<<<<<< Updated upstream
=======
        console.error("Decrypt failed for pair:", pair_id);
>>>>>>> Stashed changes
        return new Response(
          JSON.stringify({ error: "decrypt_failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
<<<<<<< Updated upstream
=======

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
>>>>>>> Stashed changes

      const tokenRes = await spotifyTokenExchange(new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: decryptedRefresh,
      }));

      const tokenData = await tokenRes.json();

      if (tokenData.error === "invalid_grant") {
<<<<<<< Updated upstream
        await supabaseDelete("spotify_config", `pair_id=eq.${pair_id}`);
=======
        await supabase.from("spotify_config").delete().eq("pair_id", pair_id);
>>>>>>> Stashed changes
        return new Response(
          JSON.stringify({ error: "reconnect_required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (tokenData.error) {
        return new Response(
          JSON.stringify(tokenData),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      const newRefreshToken = refresh_token || decryptedRefresh;
      const token_expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

<<<<<<< Updated upstream
      const { data: encAccess } = await supabaseRpc("encrypt_token", {
=======
      const { data: encAccess } = await supabase.rpc("encrypt_token", {
>>>>>>> Stashed changes
        p_token: access_token,
        p_key: ENCRYPTION_KEY,
      });
      const { data: encRefresh } = await supabaseRpc("encrypt_token", {
        p_token: newRefreshToken,
        p_key: ENCRYPTION_KEY,
      });

      await supabaseUpdate("spotify_config", {
        access_token: encAccess,
        refresh_token: encRefresh,
        token_expires_at,
        updated_at: new Date().toISOString(),
      }, `pair_id=eq.${pair_id}`);

<<<<<<< Updated upstream
      console.log("refresh OK:", pair_id);
=======
      console.log("Refresh OK for pair:", pair_id);
>>>>>>> Stashed changes
      return new Response(
        JSON.stringify({ access_token, expires_in }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "invalid_action", error_description: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("spotify-auth error:", error);
    return new Response(
<<<<<<< Updated upstream
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
=======
      JSON.stringify({ error: "internal_error", error_description: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
>>>>>>> Stashed changes
    );
  }
});
