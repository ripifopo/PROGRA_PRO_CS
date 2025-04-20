'use client';

import { useLoading } from '../../context/LoadingContext.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useLoading();

  return (
    <>
      {loading && <LoadingSpinner />}
      {children}
    </>
  );
}
