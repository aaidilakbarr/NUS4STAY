import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import SearchResults from './pages/SearchResults';
import PropertyDetail from './pages/PropertyDetail';
import RoomDetail from './pages/RoomDetail';
import Checkout from './pages/Checkout';
import PendingPayment from './pages/PendingPayment';
import BookingHistory from './pages/BookingHistory';
import BookingDetail from './pages/BookingDetail';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash || '#/');
    };

    // Ensure we start with a hash route
    if (!window.location.hash) {
      window.location.hash = '#/';
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Parse page from hash path
  const getPageInfo = () => {
    const path = currentRoute.split('?')[0]; // Strip query params
    
    if (path.startsWith('#/detail/')) {
      return { page: 'detail', showNav: true, showFooter: true };
    }
    if (path.startsWith('#/room/')) {
      return { page: 'room', showNav: true, showFooter: true };
    }
    if (path.startsWith('#/checkout/')) {
      return { page: 'checkout', showNav: true, showFooter: false };
    }
    if (path.startsWith('#/pending/')) {
      return { page: 'pending', showNav: false, showFooter: false };
    }
    if (path.startsWith('#/history-detail/')) {
      return { page: 'history-detail', showNav: false, showFooter: true };
    }
    if (path === '#/history') {
      return { page: 'history', showNav: true, showFooter: true };
    }
    if (path.startsWith('#/search')) {
      return { page: 'search', showNav: true, showFooter: true };
    }
    return { page: 'landing', showNav: true, showFooter: true };
  };

  const { page, showNav, showFooter } = getPageInfo();

  const renderPage = () => {
    switch (page) {
      case 'landing':
        return <LandingPage />;
      case 'search':
        return <SearchResults />;
      case 'detail':
        return <PropertyDetail />;
      case 'room':
        return <RoomDetail />;
      case 'checkout':
        return <Checkout />;
      case 'pending':
        return <PendingPayment />;
      case 'history':
        return <BookingHistory />;
      case 'history-detail':
        return <BookingDetail />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-body-md text-body-md text-on-background">
      {showNav && <Navbar currentPage={page} />}
      <div className="flex-grow">
        {renderPage()}
      </div>
      {showFooter && <Footer />}
    </div>
  );
}

export default App;
