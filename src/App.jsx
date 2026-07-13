import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RoleGuard from './components/RoleGuard';
import LandingPage from './pages/LandingPage';
import SearchResults from './pages/SearchResults';
import PropertyDetail from './pages/PropertyDetail';
import RoomDetail from './pages/RoomDetail';
import Checkout from './pages/Checkout';
import PendingPayment from './pages/PendingPayment';
import BookingHistory from './pages/BookingHistory';
import BookingDetail from './pages/BookingDetail';
import LoginPage from './pages/LoginPage';
import AdminProperties from './pages/AdminProperties';
import AdminVerification from './pages/AdminVerification';
import { getRouteInfo } from './routes/getRouteInfo';

const pageComponents = {
  landing: LandingPage,
  search: SearchResults,
  detail: PropertyDetail,
  room: RoomDetail,
  checkout: Checkout,
  pending: PendingPayment,
  history: BookingHistory,
  'history-detail': BookingDetail,
  login: LoginPage,
  'admin-properties': AdminProperties,
  'admin-payments': AdminVerification,
};

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash || '#/');
    };

    if (!window.location.hash) {
      window.location.hash = '#/';
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const { page, showNav, showFooter, protected: isProtected, roles } = getRouteInfo(currentRoute);

  const PageComponent = pageComponents[page] ?? LandingPage;

  const pageContent = isProtected ? (
    <RoleGuard roles={roles}>
      <PageComponent />
    </RoleGuard>
  ) : (
    <PageComponent />
  );

  return (
    <div className="min-h-screen flex flex-col bg-background font-body-md text-body-md text-on-background">
      {showNav && <Navbar currentPage={page} />}
      <div className="flex-grow">{pageContent}</div>
      {showFooter && <Footer />}
    </div>
  );
}

export default App;
