import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush";

// ── VAPID key conversion helpers ─────────────────────────────────────────────
// Converts raw base64url keys to JWK format for @negrel/webpush

function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function convertVapidKeysToJWK(publicKeyBase64url: string, privateKeyBase64url: string) {
  const publicKeyBuffer = base64urlToArrayBuffer(publicKeyBase64url);
  if (publicKeyBuffer.byteLength !== 65) {
    throw new Error(`Invalid public key length: ${publicKeyBuffer.byteLength} bytes, expected 65 for uncompressed P-256`);
  }
  const publicKeyBytes = new Uint8Array(publicKeyBuffer);
  // Skip 0x04 prefix, extract x (32 bytes) and y (32 bytes)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  const privateKeyBuffer = base64urlToArrayBuffer(privateKeyBase64url);

  return {
    publicKey: {
      kty: "EC",
      crv: "P-256",
      alg: "ES256",
      x: arrayBufferToBase64url(x),
      y: arrayBufferToBase64url(y),
      key_ops: ["verify"],
      ext: true,
    },
    privateKey: {
      kty: "EC",
      crv: "P-256",
      alg: "ES256",
      x: arrayBufferToBase64url(x),
      y: arrayBufferToBase64url(y),
      d: arrayBufferToBase64url(privateKeyBuffer),
      key_ops: ["sign"],
      ext: true,
    },
  };
}

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
    const { recipient_id, sender_name, message_text } = await req.json();
    console.log("send-chat-push: payload:", { recipient_id, sender_name });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch subscriptions for recipient
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", recipient_id);

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
    const publicKeyBase64url = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const privateKeyBase64url = Deno.env.get("VAPID_PRIVATE_KEY")!;
    if (!publicKeyBase64url || !privateKeyBase64url) {
      throw new Error("Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY env vars");
    }

    const exportedVapidKeys = convertVapidKeysToJWK(publicKeyBase64url, privateKeyBase64url);
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
