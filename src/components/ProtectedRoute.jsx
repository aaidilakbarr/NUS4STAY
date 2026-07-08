import React from 'react';
import RoleGuard from './RoleGuard';

export default function ProtectedRoute({ children }) {
  return <RoleGuard>{children}</RoleGuard>;
}
