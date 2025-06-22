// tests/CategoryPage.test.tsx 
// #### CORRER CON "npx jest tests/CategoryPage.test.tsx --coverage" ####

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryPage from '@/app/comparator/categories/[category]/page';
import { useParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

describe('🧪 CategoryPage Component', () => {
  const mockParams = { category: 'analgesicos' };

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue(mockParams);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const fakeMedicines = [
    { id: 1, name: 'Paracetamol', pharmacy: 'Cruz Verde', offer_price: 1000, normal_price: 1200, discount: 20 },
    { id: 2, name: 'Ibuprofeno', pharmacy: 'Salcobrand', offer_price: 2000, normal_price: 2500, discount: 10 },
    { id: 3, name: 'Diclofenaco', pharmacy: 'Ahumada', offer_price: 3000, normal_price: 4000, discount: 25 },
  ];

  it('🔃 muestra spinner mientras carga', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
    render(<CategoryPage />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('📋 muestra medicamentos después de cargar', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(fakeMedicines),
    });

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
      expect(screen.getByText('Ibuprofeno')).toBeInTheDocument();
      expect(screen.getByText('Diclofenaco')).toBeInTheDocument();
    });
  });

  it('🔍 filtra medicamentos por nombre', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(fakeMedicines),
    });

    render(<CategoryPage />);

    const input = await screen.findByPlaceholderText(/buscar/i);
    fireEvent.change(input, { target: { value: 'para' } });

    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
      expect(screen.queryByText('Ibuprofeno')).not.toBeInTheDocument();
    });
  });

  it('🏪 filtra por farmacia', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(fakeMedicines),
    });

    render(<CategoryPage />);

    const checkbox = await screen.findByLabelText('Cruz Verde');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
      expect(screen.queryByText('Ibuprofeno')).not.toBeInTheDocument();
    });
  });

  it('💸 filtra por precio', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(fakeMedicines),
    });

    render(<CategoryPage />);

    const minInput = await screen.findByLabelText('Precio mínimo');
    const maxInput = screen.getByLabelText('Precio máximo');
    fireEvent.change(minInput, { target: { value: '1000' } });
    fireEvent.change(maxInput, { target: { value: '2000' } });

    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
      expect(screen.queryByText('Diclofenaco')).not.toBeInTheDocument();
    });
  });

  it('📉 filtra por descuento', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(fakeMedicines),
    });

    render(<CategoryPage />);

    const minInput = await screen.findByLabelText('Descuento mínimo');
    const maxInput = screen.getByLabelText('Descuento máximo');
    fireEvent.change(minInput, { target: { value: '15' } });
    fireEvent.change(maxInput, { target: { value: '25' } });

    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
      expect(screen.queryByText('Ibuprofeno')).not.toBeInTheDocument();
    });
  });

  it('♻️ limpia filtros al hacer clic en reset', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(fakeMedicines),
    });

    render(<CategoryPage />);

    const resetButton = await screen.findByText(/reiniciar filtros/i);
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
      expect(screen.getByText('Ibuprofeno')).toBeInTheDocument();
    });
  });
});
