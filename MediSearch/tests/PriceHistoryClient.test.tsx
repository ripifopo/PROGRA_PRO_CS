// tests/PriceHistoryClient.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PriceHistoryClient from '@/app/price-history/PriceHistoryClient';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// 🧪 Helper: mock fetch con estructura correcta
const mockFetch = (historyData: any, medicinesData: any = []) => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => historyData,
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => medicinesData,
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
    const history = {
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

    const allMeds = [
      {
        pharmacy: 'Cruz Verde',
        categories: {
          analgésicos: [history],
        },
      },
    ];

    mockFetch(history, allMeds);

    render(<PriceHistoryClient />);

    await waitFor(() => {
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      expect(screen.getByText('Cruz Verde')).toBeInTheDocument();
      expect(screen.getByText('Precio actual: $1290')).toBeInTheDocument();
    });
  });

  it('⚠️ muestra mensaje de error si no se obtiene el medicamento', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => undefined,
    });

    render(<PriceHistoryClient />);

    await waitFor(() => {
      expect(screen.getByText(/no se pudo encontrar/i)).toBeInTheDocument();
    });
  });

  it('↩️ botón de volver redirige al home', async () => {
    const med = {
      id: 123,
      name: 'Ibuprofeno',
      pharmacy: 'Salcobrand',
      category: 'antiinflamatorios',
      offer_price: 2500,
      normal_price: 2900,
      history: [],
    };

    const allMeds = [
      {
        pharmacy: 'Salcobrand',
        categories: {
          antiinflamatorios: [med],
        },
      },
    ];

    mockFetch(med, allMeds);

    render(<PriceHistoryClient />);
    const button = await screen.findByRole('button', { name: /volver/i });
    fireEvent.click(button);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('📦 selecciona medicamento automáticamente desde search params', async () => {
    const med = {
      id: 999,
      name: 'Clonazepam',
      pharmacy: 'Ahumada',
      category: 'ansiolíticos',
      offer_price: 1234,
      normal_price: 1450,
    };

    fakeSearchParams.set('fromMedicine', 'true');
    fakeSearchParams.set('medicineId', '999');
    fakeSearchParams.set('pharmacy', 'Ahumada');
    fakeSearchParams.set('name', 'Clonazepam');
    fakeSearchParams.set('category', 'ansiolíticos');

    const allMeds = [
      {
        pharmacy: 'Ahumada',
        categories: {
          ansioliticos: [med],
        },
      },
    ];

    mockFetch({ ...med, history: [] }, allMeds);

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

    const allMeds = [
      {
        pharmacy: 'Mixtas',
        categories: {
          otros: meds,
        },
      },
    ];

    mockFetch({ ...meds[0], history: [] }, allMeds);

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

    const allMeds = [
      {
        pharmacy: 'X',
        categories: {
          genericos: meds,
        },
      },
    ];

    mockFetch({ ...meds[0], history: [] }, allMeds);

    render(<PriceHistoryClient />);

    await waitFor(() => {
      meds.forEach((m) => {
        expect(screen.getByText(m.name)).toBeInTheDocument();
      });
    });

    const buttons = screen.getAllByText(/agregar/i);
    buttons.forEach((btn) => fireEvent.click(btn));

    // Validación: solo se pueden agregar 3
    const comparables = screen.getAllByText(/comparar/i);
    expect(comparables.length).toBeLessThanOrEqual(3);
  });
});
