import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AuraChatWidget from './AuraChatWidget';

/**
 * Layout Component
 * Wraps routes with global Navbar, Footer, and persistent AuraChatWidget.
 */
function Layout({ children }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  if (isHomePage) {
    return (
      <>
        {children}
        <AuraChatWidget />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 relative">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
      <AuraChatWidget />
    </div>
  );
}

export default Layout;
