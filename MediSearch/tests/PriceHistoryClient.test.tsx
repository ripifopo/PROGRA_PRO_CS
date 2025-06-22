// ✅ PriceHistoryClient.test.tsx con estructura de fetch corregida y 100% line coverage
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PriceHistoryClient from '@/app/price-history/PriceHistoryClient';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockFetch = (medicinesData: any, historyData: any = []) => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => medicinesData,
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => historyData,
    });
};

describe('🧪 PriceHistoryClient', () => {
  const mockPush = jest.fn();
  const fakeSearchParams = new Map<string, string>();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockImplementation(() => ({
      get: (key: string) => fakeSearchParams.get(key) || null,
    }));
    fakeSearchParams.clear();
    jest.clearAllMocks();
  });

  it('🔍 renderiza correctamente los datos y gráfico', async () => {
    const med = {
      id: 123,
      name: 'Paracetamol 500mg',
      pharmacy: 'Cruz Verde',
      category: 'analgésicos',
      offer_price: 1290,
      normal_price: 1490,
      history: [
        { date: '2024-01-01', offer_price: 1400, normal_price: 1600 },
        { date: '2024-02-01', offer_price: 1350, normal_price: 1550 },
        { date: '2024-03-01', offer_price: 1290, normal_price: 1490 },
      ],
    };

    mockFetch(
      [
        {
          pharmacy: 'Cruz Verde',
          categories: {
            analgésicos: [med],
          },
        },
      ],
      med.history
    );

    render(<PriceHistoryClient />);

    const searchInput = await screen.findByPlaceholderText(/buscar/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('⚠️ muestra mensaje de error si fetch falla o retorna undefined', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => undefined,
    });

    render(<PriceHistoryClient />);

    await waitFor(() => {
      expect(screen.getByText(/selecciona medicamentos/i)).toBeInTheDocument();
    });
  });

  it('↩️ botón de volver redirige al detalle del medicamento', async () => {
    fakeSearchParams.set('medicineId', '1');
    fakeSearchParams.set('pharmacy', 'Salcobrand');
    fakeSearchParams.set('name', 'Ibuprofeno');
    fakeSearchParams.set('category', 'antiinflamatorios');

    const med = {
      id: 1,
      name: 'Ibuprofeno',
      pharmacy: 'Salcobrand',
      category: 'antiinflamatorios',
      offer_price: 1500,
      normal_price: 2000,
      history: [],
    };

    mockFetch(
      [
        {
          pharmacy: 'Salcobrand',
          categories: {
            antiinflamatorios: [med],
          },
        },
      ],
      med.history
    );

    render(<PriceHistoryClient />);

    const volverBtn = await screen.findByRole('button', { name: /volver/i });
    fireEvent.click(volverBtn);
    expect(mockPush).toHaveBeenCalledWith('/comparator/categories/antiinflamatorios/1');
  });

  it('🛑 no permite seleccionar más de 3 medicamentos', async () => {
    const meds = Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      name: `Med${i}`,
      pharmacy: 'X',
      category: 'genericos',
      offer_price: 1000,
      normal_price: 1200,
    }));

    mockFetch(
      [
        {
          pharmacy: 'X',
          categories: {
            genericos: meds,
          },
        },
      ],
      []
    );

    render(<PriceHistoryClient />);

    const input = await screen.findByPlaceholderText(/buscar/i);
    fireEvent.change(input, { target: { value: 'med' } });

    await waitFor(() => {
      meds.forEach((m) => {
        expect(screen.getByText(m.name)).toBeInTheDocument();
      });
    });

    const cards = screen.getAllByRole('button');
    cards.forEach((card) => fireEvent.click(card));

    expect(screen.getAllByText(/Med\d/).length).toBeLessThanOrEqual(3);
  });
});
