'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

// Tipo del contexto
interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

// Crea el contexto por defecto
const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

// Hook personalizado
export function useLoading() {
  return useContext(LoadingContext);
}

// Proveedor que envuelve la app
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}
