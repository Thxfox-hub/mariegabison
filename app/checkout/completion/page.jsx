"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
function CompletionInner() {
  const [status, setStatus] = useState();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams ? searchParams.get("session_id") : null;
    const clientSecret = searchParams ? searchParams.get("payment_intent_client_secret") : null;

    async function check() {
      // Prefer server-side retrieval by session_id (Checkout)
      if (sessionId) {
        try {
          const res = await fetch(`/api/checkout/retrieve?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' });
          if (!res.ok) throw new Error('Retrieve failed');
          const data = await res.json();
          if (data?.status) { setStatus(data.status); return; }
        } catch {}
      }
      // Fallback to client secret flow if provided
      if (clientSecret && window?.Stripe) {
        try {
          const stripe = window.Stripe?.(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");
          if (!stripe) throw new Error('Stripe unavailable');
          const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
          switch (paymentIntent?.status) {
            case "succeeded": setStatus("success"); break;
            case "processing": setStatus("processing"); break;
            default: setStatus("failure"); break;
          }
          return;
        } catch {}
      }
      setStatus("failure");
    }
    check();
  }, [searchParams]);

  if (!status) {
    return (
      <div className="container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ maxWidth: 520, width: "100%" }}>
        <div className="card-body">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            {status === "success" && <div style={{ color: "#16a34a", fontSize: 36 }} aria-hidden>✓</div>}
            {status === "failure" && <div style={{ color: "#dc2626", fontSize: 36 }} aria-hidden>✕</div>}
            {status === "processing" && (
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 9999 }} aria-hidden />
            )}
          </div>
          <h2 style={{ textAlign: "center", marginTop: 0 }}>
            {status === "success" && "Payment Successful!"}
            {status === "failure" && "Payment Failed"}
            {status === "processing" && "Payment Processing"}
          </h2>
          <p className="text-muted-foreground" style={{ textAlign: "center" }}>
            {status === "success" && "Thank you for your order. You will receive a confirmation email shortly."}
            {status === "failure" && "There was an issue processing your payment. Please try again."}
            {status === "processing" && "Your payment is being processed. We'll update you once it's complete."}
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <a className="btn" href="/">Return to Shop</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompletionPage() {
  return <CompletionInner />;
}
