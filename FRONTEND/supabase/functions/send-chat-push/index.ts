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

    // Import web-push library
    const webpush = await import("npm:@negrel/webpush@1.1.1");

    // Load VAPID keys from Vault
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;

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

        await webpush.sendPush(pushSubscription, payload, {
          applicationServerKey: vapidPublicKey,
          privateKey: vapidPrivateKey,
        });

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
