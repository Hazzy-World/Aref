import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

export const STRIPE_PRICES = {
  scholar: process.env.STRIPE_SCHOLAR_PRICE_ID || "",
  sage: process.env.STRIPE_SAGE_PRICE_ID || "",
};

export const PLAN_METADATA: Record<string, string> = {
  scholar: "scholar",
  sage: "sage",
};
