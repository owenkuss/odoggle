import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PRO_PRICE_USD } from "@odoggle/shared";

async function creemCheckout(playerId: string, baseUrl: string) {
  const apiKey = process.env.CREEM_API_KEY;
  const productId = process.env.CREEM_PRODUCT_ID;
  if (!apiKey || !productId) return null;

  const res = await fetch("https://api.creem.io/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      success_url: `${baseUrl}/pricing?success=1`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: { playerId },
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { checkout_url?: string; url?: string };
  return data.checkout_url ?? data.url ?? null;
}

export async function POST(req: Request) {
  const { playerId } = await req.json();
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  const creemUrl = await creemCheckout(String(playerId), baseUrl);
  if (creemUrl) return NextResponse.json({ url: creemUrl });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({
      demo: true,
      message: "Payment not configured — demo mode enabled",
    });
  }

  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Odoggle Pro" },
          unit_amount: Math.round(PRO_PRICE_USD * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { playerId: String(playerId) },
    success_url: `${baseUrl}/pricing?success=1`,
    cancel_url: `${baseUrl}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
