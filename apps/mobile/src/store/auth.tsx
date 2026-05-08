import { createContext, useContext, useMemo, useState } from 'react';

interface AuthState {
  token: string | null;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthState>({ token: null, setToken: () => undefined });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const value = useMemo(() => ({ token, setToken }), [token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
