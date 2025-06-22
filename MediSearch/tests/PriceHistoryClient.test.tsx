// tests/PriceHistoryClient.test.tsx 
// #### EJECUTAR CON "npx jest tests/PriceHistoryClient.test.tsx --coverage" ####

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PriceHistoryClient from '@/app/price-history/PriceHistoryClient';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

// 📌 Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// 🧪 Helper: mock fetch
const mockFetch = (data: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  ) as jest.Mock;
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('🔍 renderiza correctamente los datos y gráfico', async () => {
    const fakeData = {
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

    mockFetch(fakeData);

    render(<PriceHistoryClient />);

    await waitFor(() => {
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      expect(screen.getByText('Cruz Verde')).toBeInTheDocument();
      expect(screen.getByText('Precio actual: $1290')).toBeInTheDocument();
    });
  });

  it('⚠️ muestra mensaje de error si no se obtiene el medicamento', async () => {
    mockFetch(undefined);

    render(<PriceHistoryClient />);

    await waitFor(() => {
      expect(screen.getByText(/no se pudo encontrar/i)).toBeInTheDocument();
    });
  });

  it('↩️ botón de volver redirige al home', async () => {
    mockFetch({
      id: 123,
      name: 'Ibuprofeno',
      pharmacy: 'Salcobrand',
      category: 'antiinflamatorios',
      offer_price: 2500,
      normal_price: 2900,
      history: [],
    });

    render(<PriceHistoryClient />);

    const button = await screen.findByRole('button', { name: /volver/i });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('📦 selecciona medicamento automáticamente desde search params', async () => {
    const allMeds = [
      {
        id: 999,
        name: 'Clonazepam',
        pharmacy: 'Ahumada',
        category: 'ansiolíticos',
        offer_price: 1234,
        normal_price: 1450,
      },
    ];

    fakeSearchParams.set('fromMedicine', 'true');
    fakeSearchParams.set('medicineId', '999');
    fakeSearchParams.set('pharmacy', 'Ahumada');
    fakeSearchParams.set('name', 'Clonazepam');
    fakeSearchParams.set('category', 'ansiolíticos');

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ ...allMeds[0], history: [] }) }) // history fetch
      .mockResolvedValueOnce({ json: async () => allMeds }); // /api/medicines

    render(<PriceHistoryClient />);

    await waitFor(() => {
      expect(screen.getByText(/Clonazepam/)).toBeInTheDocument();
    });
  });

  it('🔍 filtra medicamentos según búsqueda', async () => {
    const meds = [
      { id: 1, name: 'Ibuprofeno', pharmacy: 'A', category: '', offer_price: 1000, normal_price: 1200 },
      { id: 2, name: 'Paracetamol', pharmacy: 'B', category: '', offer_price: 1100, normal_price: 1300 },
    ];

    mockFetch({ ...meds[0], history: [] }); // dummy history
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: async () => ({ ...meds[0], history: [] }) })
      .mockResolvedValueOnce({ json: async () => meds });

    render(<PriceHistoryClient />);

    const input = await screen.findByPlaceholderText(/buscar/i);
    fireEvent.change(input, { target: { value: 'para' } });

    await waitFor(() => {
      expect(screen.getByText(/Paracetamol/)).toBeInTheDocument();
      expect(screen.queryByText(/Ibuprofeno/)).not.toBeInTheDocument();
    });
  });

  it('🛑 no permite seleccionar más de 3 medicamentos', async () => {
    const meds = Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      name: `Med${i}`,
      pharmacy: 'X',
      category: '',
      offer_price: 1000,
      normal_price: 1200,
    }));

    mockFetch({ ...meds[0], history: [] });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ ...meds[0], history: [] }) })
      .mockResolvedValueOnce({ json: async () => meds });

    render(<PriceHistoryClient />);

    await waitFor(() => {
      const selects = meds.map((med) => med.name);
      selects.forEach((name) => screen.getByText(name));
    });

    const buttons = screen.getAllByText(/agregar/i);
    buttons.forEach((btn) => fireEvent.click(btn));

    expect(screen.getAllByText(/comparar/i).length).toBeLessThanOrEqual(3);
  });
});
