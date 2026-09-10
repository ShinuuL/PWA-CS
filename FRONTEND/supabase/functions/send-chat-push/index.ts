import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.8";
import * as webpush from "jsr:@negrel/webpush@0.5.0";
import { requireInternal, requireUuid, readBody, HttpError, errorResponse } from "../_shared/security.js";
import { vapidKeysToJwk } from "../_shared/vapid.ts";


// ── CORS ─────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  console.log("send-chat-push: request received");

  try {
    requireInternal(req, Deno.env.get("PUSH_INTERNAL_SECRET"));
    const { message_id } = await readBody(req);
    requireUuid(message_id);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: message, error: messageError } = await supabase.from("messages")
      .select("pair_id,sender_id,content").eq("id", message_id).maybeSingle();
    if (messageError) throw messageError;
    if (!message) throw new HttpError(404, "message_not_found");
    const { data: pair, error: pairError } = await supabase.from("pairs")
      .select("user_one,user_two").eq("id", message.pair_id).maybeSingle();
    if (pairError) throw pairError;
    if (!pair?.user_two || ![pair.user_one, pair.user_two].includes(message.sender_id)) throw new HttpError(403, "forbidden");
    const recipient_id = pair.user_one === message.sender_id ? pair.user_two : pair.user_one;
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("display_name").eq("id", message.sender_id).maybeSingle();
    if (profileError) throw profileError;
    const sender_name = profile?.display_name || "Seu par";
    const message_text = message.content;

    // Fetch subscriptions for recipient
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", recipient_id)
      .eq("pair_id", message.pair_id);

    if (subError) {
      console.error("send-chat-push: DB error:", subError);
      throw subError;
    }
    if (!subscriptions || subscriptions.length === 0) {
      console.log("send-chat-push: no subscriptions for user", recipient_id);
      return new Response(
        JSON.stringify({ success: true, message: "No subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`send-chat-push: found ${subscriptions.length} subscriptions`);

    // ── VAPID key setup ────────────────────────────────────────────────────
    const exportedVapidKeys = vapidKeysToJwk(
      Deno.env.get("VAPID_PUBLIC_KEY"),
      Deno.env.get("VAPID_PRIVATE_KEY")
    );

    const vapidKeys = await webpush.importVapidKeys(exportedVapidKeys, { extractable: false });
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: Deno.env.get("VAPID_SUBJECT") || "mailto:notifications@couplespace.app",
      vapidKeys,
    });
    console.log("send-chat-push: VAPID keys imported successfully");

    // ── Build payload ──────────────────────────────────────────────────────
    const truncatedMessage = message_text && message_text.length > 50
      ? message_text.substring(0, 47) + "..."
      : message_text || "New message";

    const payload = JSON.stringify({
      title: sender_name || "Partner",
      body: truncatedMessage,
      tag: "couplespace-chat",
      url: "/chat",
    });

    // ── Send to each subscription ──────────────────────────────────────────
    let successCount = 0;
    let failedEndpoints: string[] = [];
    let pushErrors: string[] = [];

    for (const sub of subscriptions) {
      try {
        console.log(`send-chat-push: attempting push to user=${sub.user_id} endpoint=${sub.endpoint.substring(0, 60)}...`);
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const subscriber = appServer.subscribe(pushSubscription);
        await subscriber.pushTextMessage(payload, {});
        successCount++;
        console.log(`send-chat-push: SUCCESS for ${sub.user_id}`);
      } catch (pushError: any) {
        const msg = pushError?.message || String(pushError);
        const statusCode = pushError?.statusCode || pushError?.status || "unknown";
        console.error(`send-chat-push: PUSH FAILED user=${sub.user_id} status=${statusCode} msg=${msg}`);
        if (statusCode === 410) {
          failedEndpoints.push(sub.endpoint);
        } else {
          pushErrors.push(`status=${statusCode}: ${msg}`);
        }
      }
    }

    // Clean up expired subscriptions
    if (failedEndpoints.length > 0) {
      console.log(`send-chat-push: cleaning up ${failedEndpoints.length} expired subscriptions`);
      await supabase.from("push_subscriptions").delete().in("endpoint", failedEndpoints);
    }

    const result = {
      success: true,
      sent: successCount,
      totalSubscriptions: subscriptions.length,
      cleanedUp: failedEndpoints.length,
      pushErrors,
    };
    console.log("send-chat-push: FINAL RESULT:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-chat-push: fatal error:", error.message);
    return errorResponse(error, corsHeaders);
  }
});
