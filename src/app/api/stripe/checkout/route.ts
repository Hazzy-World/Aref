import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { requireAuth, apiError } from "@/lib/api-helpers";

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { plan } = await req.json() as { plan: "scholar" | "sage" };

  if (!plan || !STRIPE_PRICES[plan]) {
    return apiError("Invalid plan");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("email, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: profile?.stripe_customer_id || undefined,
    customer_email: profile?.stripe_customer_id ? undefined : (profile?.email ?? user.email),
    line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { userId: user.id, plan },
    subscription_data: { metadata: { userId: user.id, plan } },
  });

  return NextResponse.json({ url: session.url });
}
