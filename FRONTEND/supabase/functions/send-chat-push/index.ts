import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ApplicationServer, importVapidKeys } from "jsr:@negrel/webpush";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:notifications@couplespace.app";

async function createApplicationServer() {
  const rawVapidKeys = Deno.env.get("VAPID_PRIVATE_KEY")
  if (!rawVapidKeys) {
    throw new Error("Missing VAPID_PRIVATE_KEY")
  }

  let exportedKeys
  try {
    exportedKeys = JSON.parse(rawVapidKeys)
  } catch {
    throw new Error("VAPID_PRIVATE_KEY must be a JSON string containing exported VAPID keys")
  }

  if (!exportedKeys?.publicKey || !exportedKeys?.privateKey) {
    throw new Error("VAPID_PRIVATE_KEY must contain publicKey and privateKey properties")
  }

  const vapidKeys = await importVapidKeys(exportedKeys)
  return ApplicationServer.new({
    crypto,
    contactInformation: vapidSubject,
    vapidKeys,
  })
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { recipient_id, sender_name, message_text } = await req.json();

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all push subscriptions for this recipient
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", recipient_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No subscriptions found for recipient",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appServer = await createApplicationServer();

    // Truncate message to ~50 chars (D-26)
    const truncatedMessage =
      message_text && message_text.length > 50
        ? message_text.substring(0, 47) + "..."
        : message_text || "New message";

    // Send push to each subscription
    let successCount = 0;
    let failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const payload = JSON.stringify({
          title: sender_name || "Partner",
          body: truncatedMessage,
          tag: "couplespace-chat",
          url: "/chat",
        });

        const subscriber = appServer.subscribe(pushSubscription);
        await subscriber.pushTextMessage(payload, { urgency: "high" });

        successCount++;
      } catch (pushError: any) {
        // 410 Gone — subscription expired, remove it (research pitfall 3)
        if (pushError.status === 410 || pushError.statusCode === 410) {
          failedEndpoints.push(sub.endpoint);
          console.log(`Removing expired subscription: ${sub.endpoint}`);
        } else {
          console.error(`Push failed for ${sub.endpoint}:`, pushError);
        }
      }
    }

    // Remove expired subscriptions (410 cleanup)
    if (failedEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", failedEndpoints);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        cleanedUp: failedEndpoints.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-chat-push error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
