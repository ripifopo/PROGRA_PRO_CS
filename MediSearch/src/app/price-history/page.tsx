import React, { Suspense } from 'react';
import PriceHistoryClient from './PriceHistoryClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando historial de precios...</div>}>
      <PriceHistoryClient />
    </Suspense>
  );
}
