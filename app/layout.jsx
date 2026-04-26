/**
 * layout.jsx - Marie Gabison Bijoux
 * Root layout with cart context, i18n, and app shell
 */
import './globals.css';
import { CartProvider } from '../components/CartProvider';
import { I18nProvider } from '../lib/i18n/context';
import Footer from '../components/Footer';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'Marie Gabison | Bijoux',
  description: "Marie Gabison – Bijoux faits main. Colliers, bracelets, boucles d'oreilles et plus.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <I18nProvider>
          <CartProvider>
            <AppShell>
              {children}
            </AppShell>
            <Footer />
          </CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
