import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
export default function LoginRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={`/login?returnTo=${encodeURIComponent(pathname + search)}`} replace/>;
}