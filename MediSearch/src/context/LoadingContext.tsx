// Archivo: src/context/LoadingContext.tsx

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import '../app/FullPageLoader.css'; // Se importa el estilo visual del loader

// Definición del tipo para el contexto de carga
interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

// Se crea el contexto con valores por defecto
const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

// Hook personalizado para acceder al contexto
export const useLoading = () => useContext(LoadingContext);

// Proveedor global de estado de carga que envuelve la aplicación
export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}

      {/* Overlay visual cuando isLoading = true */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-box text-center">
            <div className="pill-bounce">💊</div>
            <div className="loading-bar mt-3">
              <div className="loading-progress" />
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};
