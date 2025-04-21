'use client';

import { useLoading } from '../../context/LoadingContext';
import FullPageLoader from './FullPageLoader';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useLoading();

  return (
    <>
      {loading && <FullPageLoader />} {/* ← Pantalla de carga fullscreen */}
      {children}
    </>
  );
}
