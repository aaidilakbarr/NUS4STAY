import React from 'react';
import { useAuth } from '../contexts/useAuth';

export default function RoleGuard({ roles = [], children, fallbackHash = '#/' }) {
  const { isAuthenticated, authLoading, hasRole } = useAuth();

  if (authLoading) {
    return <div className="py-20 text-center font-body-md text-on-surface-variant">Loading access...</div>;
  }

  if (!isAuthenticated) {
    window.location.hash = '#/login';
    return null;
  }

  if (roles.length > 0 && !hasRole(roles)) {
    window.location.hash = fallbackHash;
    return null;
  }

  return children;
}
