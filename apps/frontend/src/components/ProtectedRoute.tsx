import { useState } from 'react';
import type { AuthUser } from '@gym/shared';
import { getCurrentUser } from '../services/auth.service.js';
import { LoginForm } from './LoginForm.js';

interface ProtectedRouteProps {
  children: (user: AuthUser) => React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  if (!user) return <LoginForm onAuthenticated={setUser} />;
  return <>{children(user)}</>;
}
