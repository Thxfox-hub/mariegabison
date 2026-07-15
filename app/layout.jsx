/**
 * layout.jsx - Marie Gabison Bijoux
 * Root layout with cart context, i18n, and app shell
 */
import './globals.css';
import { CartProvider } from '../components/CartProvider';
import { I18nProvider } from '../lib/i18n/context';
import { UserProvider } from '../components/UserProvider';
import Footer from '../components/Footer';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'Marie Gabison Paris — Bijoux d\'exception depuis 1996',
  description: "Marie Gabison Paris — Designer de bijoux d'exception. Modèles uniques, sur-mesure à Paris et pièces signatures numérotées.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
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
