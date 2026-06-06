export default function RefundPage() {
  return (
    <article className="max-w-2xl mx-auto text-zinc-400 text-sm leading-relaxed space-y-4">
      <h1 className="text-2xl font-bold text-white">Refund Policy</h1>
      <p>
        Odoggle Pro is a one-time purchase. If you are not satisfied, contact support within 14 days of purchase
        for a full refund — no questions asked.
      </p>
      <p>
        Refunds are processed through our payment provider (Stripe or Merchant of Record) to your original payment method.
        Pro features are revoked upon refund completion.
      </p>
      <p>
        Chargebacks without contacting support first may result in account suspension per our Terms of Service.
      </p>
    </article>
  );
}
