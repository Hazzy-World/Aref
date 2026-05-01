import Stripe from "stripe";

function isValidStripeKey(key: string | undefined): key is string {
  return typeof key === "string" && key.startsWith("sk_");
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!isValidStripeKey(process.env.STRIPE_SECRET_KEY)) {
      throw new Error("Stripe is not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export const STRIPE_PRICES = {
  scholar: process.env.STRIPE_SCHOLAR_PRICE_ID || "",
  sage: process.env.STRIPE_SAGE_PRICE_ID || "",
};

export const PLAN_METADATA: Record<string, string> = {
  scholar: "scholar",
  sage: "sage",
};
