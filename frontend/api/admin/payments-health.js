function providerStatus(name, hasPublicKey, hasSecretKey, note, mode = "production") {
  return {
    name,
    hasPublicKey,
    hasSecretKey,
    mode,
    productionMode: mode === "production",
    sandboxMode: mode === "sandbox",
    status: hasPublicKey && hasSecretKey ? "configured" : "missing_config",
    note,
  };
}

export default async function handler(_req, res) {
  const stripeMode = process.env.STRIPE_MODE === "sandbox" ? "sandbox" : "production";
  const paypalMode = process.env.PAYPAL_MODE === "sandbox" ? "sandbox" : "production";
  const bancontactMode = process.env.BANCONTACT_MODE === "sandbox" ? "sandbox" : "production";

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
  return res.status(200).json({
    fetchedAt: new Date().toISOString(),
    providers: [
      providerStatus(
        "Stripe",
        Boolean(process.env.VITE_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY),
        Boolean(process.env.STRIPE_SECRET_KEY),
        "Required for subscription checkout and webhook-driven entitlement activation.",
        stripeMode,
      ),
      providerStatus(
        "PayPal",
        Boolean(process.env.PAYPAL_CLIENT_ID),
        Boolean(process.env.PAYPAL_CLIENT_SECRET),
        "Required for alternative checkout coverage and subscription fallback.",
        paypalMode,
      ),
      providerStatus(
        "Bancontact",
        Boolean(process.env.BANCONTACT_MERCHANT_ID || process.env.STRIPE_SECRET_KEY),
        Boolean(process.env.BANCONTACT_SECRET || process.env.STRIPE_SECRET_KEY),
        "Can be handled directly or via Stripe payment methods depending on your acquiring setup.",
        bancontactMode,
      ),
    ],
  });
}
