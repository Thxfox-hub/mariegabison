"use client";

import { useTranslation } from '../../../lib/i18n/context';

export default function CartCanceledPage() {
  const { t } = useTranslation();
  return (
    <div className="container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ maxWidth: 520, width: "100%" }}>
        <div className="card-body">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div aria-hidden style={{ color: "#666", fontSize: 36 }}>🛒</div>
          </div>
          <h2 style={{ textAlign: "center", marginTop: 0 }}>{t('canceled.title')}</h2>
          <p className="text-muted-foreground" style={{ textAlign: "center" }}>
            {t('canceled.desc')}
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <a className="btn" href="/">{t('canceled.returnToShop')}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
