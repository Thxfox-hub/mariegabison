/**
 * layout.jsx - Marie Gabison Bijoux
 * Root layout with cart context, i18n, and app shell
 * Fonts are self-hosted via next/font (no external CDN dependency)
 */
import './globals.css';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import { CartProvider } from '../components/CartProvider';
import { I18nProvider } from '../lib/i18n/context';
import { UserProvider } from '../components/UserProvider';
import Footer from '../components/Footer';
import AppShell from '../components/AppShell';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Marie Gabison Paris — Bijoux d\'exception depuis 1996',
  description: "Marie Gabison Paris — Designer de bijoux d'exception. Modèles uniques, sur-mesure à Paris et pièces signatures numérotées.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <I18nProvider>
          <UserProvider>
            <CartProvider>
              <AppShell>
                {children}
              </AppShell>
              <Footer />
            </CartProvider>
          </UserProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
