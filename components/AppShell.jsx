"use client";

import { useState, useEffect } from "react";
import Header from "./Header";
import CartDrawer from "./CartDrawer";
import AppointmentModal from "./AppointmentModal";
import MenuOverlay from "./MenuOverlay";
import LoginModal from "./LoginModal";
import HelpModal from "./HelpModal";
import { useCart } from "./CartProvider";

export default function AppShell({ children }) {
  const { count } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);

  // Unregister any stale service workers from previous sessions
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
  }, []);

  return (
    <>
      <Header
        cartCount={count}
        onCartClick={() => setDrawerOpen(true)}
        onMenuClick={() => setMenuOpen(true)}
        onLoginClick={() => setLoginOpen(true)}
        onHelpClick={() => setHelpOpen(true)}
      />
      {children}
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onBook={() => setAppointmentOpen(true)}
      />
      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onCartClick={() => setDrawerOpen(true)}
      />
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
      <AppointmentModal
        open={appointmentOpen}
        onClose={() => setAppointmentOpen(false)}
      />
    </>
  );
}
