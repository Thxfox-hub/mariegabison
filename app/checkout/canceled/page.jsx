"use client";

export default function CartCanceledPage() {
  return (
    <div className="container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ maxWidth: 520, width: "100%" }}>
        <div className="card-body">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div aria-hidden style={{ color: "#666", fontSize: 36 }}>🛒</div>
          </div>
          <h2 style={{ textAlign: "center", marginTop: 0 }}>Panier annulé</h2>
          <p className="text-muted-foreground" style={{ textAlign: "center" }}>
            Le processus de paiement a été annulé. Vous pouvez réessayer quand vous voulez.
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <a className="btn" href="/">Retour à la boutique</a>
          </div>
        </div>
      </div>
    </div>
  );
}
