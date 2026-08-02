const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  params.set("client_id", SPOTIFY_CLIENT_ID);
  return fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, code, code_verifier, redirect_uri, pair_id } = await req.json();
    const debug: string[] = [];
    debug.push(`action=${action} pair_id=${pair_id}`);

    if (action === "exchange") {
      if (!code || !redirect_uri) {
        debug.push("EXIT: missing_params");
        return new Response(
          JSON.stringify({ error: "missing_params", _debug: debug }),
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
      debug.push(`spotify_status=${tokenRes.status} error=${tokenData.error || "none"} has_access=${!!tokenData.access_token} has_refresh=${!!tokenData.refresh_token} expires_in=${tokenData.expires_in}`);

      if (tokenData.error) {
        const status = tokenData.error === "invalid_grant" ? 401 : 400;
        debug.push(`EXIT: exchange_error ${tokenData.error}`);
        return new Response(
          JSON.stringify({ ...tokenData, _debug: debug }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      const token_expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

      const { data: encAccess, error: encAccessErr } = await supabaseRpc("encrypt_token", {
        p_token: access_token,
        p_key: ENCRYPTION_KEY,
      });
      debug.push(`encrypt_access=${!encAccessErr}`);

      const { data: encRefresh, error: encRefreshErr } = await supabaseRpc("encrypt_token", {
        p_token: refresh_token,
        p_key: ENCRYPTION_KEY,
      });
      debug.push(`encrypt_refresh=${!encRefreshErr}`);

      const upsertResult = await supabaseUpsert("spotify_config", {
        pair_id,
        access_token: encAccess,
        refresh_token: encRefresh,
        token_expires_at,
        updated_at: new Date().toISOString(),
      }, "pair_id");
      debug.push(`upsert_error=${upsertResult.error || "none"}`);

      return new Response(
        JSON.stringify({ access_token, expires_in, _debug: debug }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "refresh") {
      const { data: config, error: configErr } = await supabaseQuery(
        "spotify_config",
        `select=refresh_token&pair_id=eq.${pair_id}&limit=1`
      );
      debug.push(`config_found=${!!config} has_refresh=${!!config?.refresh_token} config_err=${configErr || "none"}`);

      if (!config?.refresh_token) {
        debug.push("EXIT: no_config");
        return new Response(
          JSON.stringify({ error: "no_config", _debug: debug }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: decryptedRefresh, error: decryptErr } = await supabaseRpc("decrypt_token", {
        p_encrypted: config.refresh_token,
        p_key: ENCRYPTION_KEY,
      });
      debug.push(`decrypt_ok=${!!decryptedRefresh} decrypt_err=${decryptErr || "none"}`);

      if (!decryptedRefresh) {
        debug.push("EXIT: decrypt_failed");
        return new Response(
          JSON.stringify({ error: "decrypt_failed", _debug: debug }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenRes = await spotifyTokenExchange(new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: decryptedRefresh,
      }));

      const tokenData = await tokenRes.json();
      debug.push(`spotify_status=${tokenRes.status} error=${tokenData.error || "none"} desc=${tokenData.error_description || "none"} has_access=${!!tokenData.access_token} has_new_refresh=${!!tokenData.refresh_token} expires_in=${tokenData.expires_in}`);

      if (tokenData.error === "invalid_grant") {
        debug.push("EXIT: invalid_grant — deleting config");
        await supabaseDelete("spotify_config", `pair_id=eq.${pair_id}`);
        return new Response(
          JSON.stringify({ error: "reconnect_required", _debug: debug }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (tokenData.error) {
        debug.push(`EXIT: spotify_error ${tokenData.error}`);
        return new Response(
          JSON.stringify({ ...tokenData, _debug: debug }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      const newRefreshToken = refresh_token || decryptedRefresh;
      const token_expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

      const { data: encAccess, error: encAccessErr } = await supabaseRpc("encrypt_token", {
        p_token: access_token,
        p_key: ENCRYPTION_KEY,
      });
      debug.push(`encrypt_access=${!encAccessErr}`);

      const { data: encRefresh, error: encRefreshErr } = await supabaseRpc("encrypt_token", {
        p_token: newRefreshToken,
        p_key: ENCRYPTION_KEY,
      });
      debug.push(`encrypt_refresh=${!encRefreshErr}`);

      const updateResult = await supabaseUpdate("spotify_config", {
        access_token: encAccess,
        refresh_token: encRefresh,
        token_expires_at,
        updated_at: new Date().toISOString(),
      }, `pair_id=eq.${pair_id}`);
      debug.push(`update_error=${updateResult.error || "none"}`);

      return new Response(
        JSON.stringify({ access_token, expires_in, _debug: debug }),
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
