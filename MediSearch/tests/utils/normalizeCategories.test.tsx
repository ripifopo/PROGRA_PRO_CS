import { normalizeCategoryName } from '@/lib/utils/normalizeCategories';

describe('🧪 normalizeCategoryName()', () => {
  test('🔸 devuelve la categoría normalizada si existe', () => {
    expect(normalizeCategoryName('DOLOR Y FIEBRE')).toBe('dolor y fiebre');
  });

  test('🔸 devuelve el valor original si no existe en mappings', () => {
    expect(normalizeCategoryName('inexistente')).toBe('inexistente');
  });
});
import { normalizeCategoryName } from '@/lib/utils/normalizeCategories';

test('🔍 devuelve el mismo valor si no hay mapping', () => {
  expect(normalizeCategoryName('desconocido')).toBe('desconocido');
});
