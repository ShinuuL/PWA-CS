import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.8";
import { ApplicationServer, importVapidKeys } from "jsr:@negrel/webpush@0.5.0";
import { requireInternal, requireUuid, readBody, HttpError, errorResponse } from "../_shared/security.js";
import { vapidKeysToJwk } from "../_shared/vapid.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:notifications@couplespace.app";

async function createApplicationServer() {
  const exportedVapidKeys = vapidKeysToJwk(
    Deno.env.get("VAPID_PUBLIC_KEY"),
    Deno.env.get("VAPID_PRIVATE_KEY")
  )

  const vapidKeys = await importVapidKeys(exportedVapidKeys)
  return ApplicationServer.new({
    contactInformation: vapidSubject,
    vapidKeys,
  })
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    requireInternal(req, Deno.env.get("PUSH_INTERNAL_SECRET"));
    const { reminder_id } = await readBody(req);
    requireUuid(reminder_id);

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: reminder, error: reminderError } = await supabase.from("shared_reminders")
      .select("pair_id,title,created_by,status,reminder_at,completed_at").eq("id", reminder_id).maybeSingle();
    if (reminderError) throw reminderError;
    if (!reminder) throw new HttpError(404, "reminder_not_found");
    if (reminder.status !== "pending" || reminder.completed_at || new Date(reminder.reminder_at).getTime() > Date.now()) throw new HttpError(409, "reminder_not_due");
    const { pair_id, title, created_by } = reminder;
    const { data: pair, error: pairError } = await supabase.from("pairs")
      .select("user_one,user_two").eq("id", pair_id).maybeSingle();
    if (pairError) throw pairError;
    if (!pair?.user_two || ![pair.user_one, pair.user_two].includes(created_by)) throw new HttpError(403, "forbidden");

    // Fetch creator's display name
    const { data: creatorProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", created_by)
      .single();

    const creatorName = creatorProfile?.display_name || "Partner";

    // Fetch all push subscriptions for this pair
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("pair_id", pair_id)
      .in("user_id", [pair.user_one, pair.user_two]);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      // No subscriptions — mark reminder as pending_send for client fallback (D-07)
      await supabase
        .from("shared_reminders")
        .update({ status: "pending_send" })
        .eq("id", reminder_id);

      return new Response(
        JSON.stringify({ success: true, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appServer = await createApplicationServer();

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
          title: `${creatorName} te lembra:`,
          body: title,
          tag: `couplespace-reminder-${reminder_id}`,
          url: "/agenda",
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

    // Update reminder status
    if (successCount > 0) {
      // At least one push succeeded → mark sent
      await supabase
        .from("shared_reminders")
        .update({ status: "sent" })
        .eq("id", reminder_id);
    } else {
      // All pushes failed → mark pending_send for client fallback (D-07)
      await supabase
        .from("shared_reminders")
        .update({ status: "pending_send" })
        .eq("id", reminder_id);
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
    console.error("send-push-notification error:", error);

    return errorResponse(error, corsHeaders);
  }
});
