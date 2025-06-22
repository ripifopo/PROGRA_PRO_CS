import { formatPrice } from '@/lib/utils/formatPrice';

describe('🧪 formatPrice()', () => {
  test('🔸 devuelve "No disponible" si price es "$0"', () => {
    expect(formatPrice('$0')).toBe('No disponible');
  });

  test('🔸 devuelve "No disponible" si price está vacío o undefined', () => {
    expect(formatPrice('')).toBe('No disponible');
    expect(formatPrice(undefined)).toBe('No disponible');
  });
});
