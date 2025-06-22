// lib/utils/formatPrice.ts

export function formatPrice(price: string | undefined): string {
 if (!price || price === '$0') return 'No disponible';
  const clean = price.replace(/[^0-9]/g, '');
  return '$' + clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
