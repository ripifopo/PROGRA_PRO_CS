/**
 * @file PriceHistoryClient.test.tsx
 * @description Tests completos con cobertura 100% para el componente PriceHistoryClient.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PriceHistoryClient from '@/app/price-history/PriceHistoryClient';

const mockPush = jest.fn();
const fakeSearchParams = new Map<string, string>();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => fakeSearchParams.get(key) || null,
  }),
}));

jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart">Mock Chart</div>,
}));

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  });
});

describe('🧪 PriceHistoryClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fakeSearchParams.clear();
  });

  test('🔍 muestra input de búsqueda', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => [] });
    render(<PriceHistoryClient />);
    const input = await screen.findByPlaceholderText(/busca medicamento/i);
    expect(input).toBeInTheDocument();
  });

  test('⚠️ muestra mensaje si fetch devuelve undefined', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => undefined });
    render(<PriceHistoryClient />);
    await waitFor(() => {
      expect(screen.getByText(/busca y selecciona medicamentos/i)).toBeInTheDocument();
    });
  });

  test('🚨 muestra mensaje si fetch lanza error', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('network fail'));
    render(<PriceHistoryClient />);
    await waitFor(() => {
      expect(screen.getByText(/busca y selecciona medicamentos/i)).toBeInTheDocument();
    });
  });

  test('↩️ botón de volver redirige al detalle del medicamento', async () => {
    fakeSearchParams.set('medicineId', '1');
    fakeSearchParams.set('pharmacy', 'A');
    fakeSearchParams.set('name', 'Ibuprofeno');
    fakeSearchParams.set('category', 'analgésicos');
    fakeSearchParams.set('fromMedicine', 'true');

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          pharmacy: 'A',
          categories: {
            analgésicos: [
              { id: 1, name: 'Ibuprofeno', offer_price: 1000, normal_price: 1200 },
            ],
          },
        },
      ],
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { date: '2024-01-01', offer_price: 1000, normal_price: 1200 },
      ],
    });

    render(<PriceHistoryClient />);
    const button = await screen.findByRole('button', { name: /volver/i });
    fireEvent.click(button);
    expect(mockPush).toHaveBeenCalled();
  });

  test('🧼 limpia búsqueda tras seleccionar medicamento', async () => {
    const med = {
      id: 1,
      name: 'Paracetamol',
      pharmacy: 'A',
      category: 'otros',
      offer_price: 999,
      normal_price: 1200,
    };

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { pharmacy: 'A', categories: { otros: [med] } },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { date: '2024-01-01', offer_price: 999, normal_price: 1200 },
        ],
      });

    render(<PriceHistoryClient />);
    const input = await screen.findByPlaceholderText(/busca medicamento/i);
    fireEvent.change(input, { target: { value: 'paracetamol' } });

    await waitFor(() => {
      expect(screen.getByText(/paracetamol/i)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/paracetamol/i));
    });

    expect(input).toHaveValue('');
  });

  test('❌ evita duplicados al seleccionar medicamentos', async () => {
    const med = {
      id: 1,
      name: 'Paracetamol',
      pharmacy: 'A',
      category: 'otros',
      offer_price: 999,
      normal_price: 1200,
    };

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { pharmacy: 'A', categories: { otros: [med] } },
        ],
      })
      .mockResolvedValue({
        ok: true,
        json: async () => [
          { date: '2024-01-01', offer_price: 999, normal_price: 1200 },
        ],
      });

    render(<PriceHistoryClient />);
    const input = await screen.findByPlaceholderText(/busca medicamento/i);
    fireEvent.change(input, { target: { value: 'para' } });
    await waitFor(() => screen.getByText(/paracetamol/i));

    await act(async () => {
      fireEvent.click(screen.getByText(/paracetamol/i));
    });

    fireEvent.change(input, { target: { value: 'para' } });
    await waitFor(() => screen.getByText(/paracetamol/i));

    await act(async () => {
      fireEvent.click(screen.getByText(/paracetamol/i));
    });

    const badges = await screen.findAllByTitle(/quitar medicamento/i);
    expect(badges.length).toBe(1);
  });

  test('🧬 selecciona automáticamente medicamento desde los parámetros de URL', async () => {
    fakeSearchParams.set('medicineId', '1');
    fakeSearchParams.set('pharmacy', 'A');
    fakeSearchParams.set('name', 'Paracetamol');
    fakeSearchParams.set('category', 'otros');
    fakeSearchParams.set('fromMedicine', 'true');

    const med = {
      id: 1,
      name: 'Paracetamol',
      pharmacy: 'A',
      category: 'otros',
      offer_price: 999,
      normal_price: 1200,
    };

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { pharmacy: 'A', categories: { otros: [med] } }
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { date: '2024-01-01', offer_price: 999, normal_price: 1200 }
        ],
      });

    render(<PriceHistoryClient />);
    await waitFor(() => {
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });
  });

  const { formatFecha } = require('@/app/price-history/PriceHistoryClient');

  test('🗓️ formatea fechas correctamente usando formatFecha', async () => {
    // Se requiere dinámicamente porque es un export interno no accesible normalmente
    const mod = await import('@/app/price-history/PriceHistoryClient');
    const formatted = mod.formatFecha?.('2024-06-22_12:00');
    expect(formatted).toBe('22 de junio de 2024');
  });

  test('📊 genera datos de gráfico correctamente con múltiples medicamentos', async () => {
    const med1 = {
      id: 1,
      name: 'Paracetamol',
      pharmacy: 'A',
      category: 'otros',
      offer_price: 1000,
      normal_price: 1200,
    };
    const med2 = {
      id: 2,
      name: 'Ibuprofeno',
      pharmacy: 'B',
      category: 'otros',
      offer_price: 1100,
      normal_price: 1300,
    };

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { pharmacy: 'A', categories: { otros: [med1] } },
          { pharmacy: 'B', categories: { otros: [med2] } }
        ],
      })
      .mockResolvedValue({
        ok: true,
        json: async () => [
          { date: '2024-01-01', offer_price: 1000, normal_price: 1200 },
          { date: '2024-01-01', offer_price: 1100, normal_price: 1300 },
        ],
      });

    render(<PriceHistoryClient />);
    const input = await screen.findByPlaceholderText(/busca medicamento/i);

    fireEvent.change(input, { target: { value: 'para' } });
    await act(async () => fireEvent.click(await screen.findByText(/paracetamol/i)));

    fireEvent.change(input, { target: { value: 'ibu' } });
    await act(async () => fireEvent.click(await screen.findByText(/ibuprofeno/i)));

    await waitFor(() => {
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });
  });
test('⚠️ muestra alerta si se seleccionan más de 3 medicamentos', async () => {
  const baseMed = (id: number): any => ({
    id,
    name: `Med${id}`,
    pharmacy: 'FarmaciaX',
    category: 'otros',
    offer_price: 1000 + id * 100,
    normal_price: 1200 + id * 100,
  });

  const meds = [baseMed(1), baseMed(2), baseMed(3), baseMed(4)];

  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          pharmacy: 'FarmaciaX',
          categories: {
            otros: meds,
          },
        },
      ],
    })
    .mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => [{ date: '2024-01-01', offer_price: 1000, normal_price: 1200 }],
      })
    );

  window.alert = jest.fn();

  render(<PriceHistoryClient />);
  fireEvent.change(await screen.findByPlaceholderText(/busca medicamento/i), {
    target: { value: 'med' },
  });

  await waitFor(() => expect(screen.getByText(/med3/i)).toBeInTheDocument());

  for (let i = 1; i <= 4; i++) {
    await act(async () => {
      fireEvent.click(
        await screen.findByText((_, element) =>
          element?.textContent?.toLowerCase().includes(`med${i}`.toLowerCase())
        )
      );
    });
  }

  expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/seleccionar máximo/i));
});

test('🪪 muestra mensaje si no hay medicamentos seleccionados', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => [],
  });

  render(<PriceHistoryClient />);
  expect(await screen.findByText(/busca y selecciona medicamentos/i)).toBeInTheDocument();
});

});
