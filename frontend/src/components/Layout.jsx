import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Layout Component
 * Wraps routes with global Navbar & Footer for sub-pages.
 * On the Home page ('/'), the full LandingPage renders its dedicated self-contained Navbar & Footer sections.
 */
function Layout({ children }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  if (isHomePage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
