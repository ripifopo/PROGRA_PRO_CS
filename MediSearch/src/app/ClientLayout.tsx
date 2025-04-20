'use client';

import { useLoading } from '../../context/LoadingContext';
import LoadingSpinner from './LoadingSpinner';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useLoading();

  return (
    <>
      {loading && <LoadingSpinner />} {/* ✅ Muestra el spinner si está activo */}
      {children}
    </>
  );
}
