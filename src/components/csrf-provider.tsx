"use client";

import { createContext, useContext, type ReactNode } from "react";

const CsrfContext = createContext<string | null>(null);

export function CsrfProvider({ token, children }: { token: string; children: ReactNode }) {
  return <CsrfContext.Provider value={token}>{children}</CsrfContext.Provider>;
}

// Dashboard mutations (Phase 6+) read this and send it back as the
// `x-csrf-token` header — see lib/auth.ts's verifyCsrf.
export function useCsrfToken(): string {
  const token = useContext(CsrfContext);
  if (!token) {
    throw new Error("useCsrfToken() must be used within a CsrfProvider.");
  }
  return token;
}
