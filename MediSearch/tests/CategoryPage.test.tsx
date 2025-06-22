'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryPage from '@/app/comparator/categories/[category]/page';
import { useParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: () => ({ push: jest.fn() }),
}));

beforeEach(() => {
  (useParams as jest.Mock).mockReturnValue({ category: 'Analgésicos' });

  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve([
          {
            pharmacy: 'Cruz Verde',
            categories: {
              Analgésicos: [
                {
                  id: 1,
                  name: 'Paracetamol',
                  offer_price: '$1000',
                  normal_price: '$2000',
                  discount: 50,
                  image: '',
                },
                {
                  id: 2,
                  name: 'Ibuprofeno',
                  offer_price: '$5000',
                  normal_price: '$5000',
                  discount: 0,
                  image: '',
                },
                {
                  id: 3,
                  name: 'Diclofenaco',
                  offer_price: '$1500',
                  normal_price: '$3000',
                  discount: 50,
                  image: '',
                },
              ],
            },
          },
        ]),
    })
  ) as jest.Mock;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('🧪 CategoryPage Component', () => {
  test('🔍 filtra medicamentos por nombre', async () => {
    render(<CategoryPage />);
    await screen.findByText(/Paracetamol/i);

    const input = screen.getByPlaceholderText(/buscar medicamento/i);
    fireEvent.change(input, { target: { value: 'para' } });

    expect(await screen.findByText(/Paracetamol/i)).toBeInTheDocument();
    expect(screen.queryByText(/Ibuprofeno/i)).not.toBeInTheDocument();
  });

  test('🏪 filtra por farmacia', async () => {
    render(<CategoryPage />);
    await screen.findByText(/Paracetamol/i);

    const checkbox = screen.getByLabelText('Cruz Verde');
    fireEvent.click(checkbox);

    expect(await screen.findByText(/Paracetamol/i)).toBeInTheDocument();
    expect(screen.getByText(/Ibuprofeno/i)).toBeInTheDocument();
    expect(screen.getByText(/Diclofenaco/i)).toBeInTheDocument();
  });

  test('💸 muestra sliders de precio correctamente', async () => {
    render(<CategoryPage />);
    const dollarTexts = await screen.findAllByText(/\$1/);
    expect(dollarTexts.length).toBeGreaterThan(0);
    expect(screen.getByText(/\$1000000/)).toBeInTheDocument();
  });

  test('♻️ limpia filtros al hacer clic en reset', async () => {
    render(<CategoryPage />);
    await screen.findByText(/Paracetamol/i);

    const input = screen.getByPlaceholderText(/buscar medicamento/i);
    fireEvent.change(input, { target: { value: 'para' } });

    const resetButton = screen.getByRole('button', { name: /Reiniciar filtros/i });
    fireEvent.click(resetButton);

    expect(await screen.findByText(/Paracetamol/i)).toBeInTheDocument();
    expect(screen.getByText(/Ibuprofeno/i)).toBeInTheDocument();
    expect(screen.getByText(/Diclofenaco/i)).toBeInTheDocument();
  });

  test('🔃 ordena por precio y descuento descendente', async () => {
    render(<CategoryPage />);
    await screen.findByText(/Paracetamol/i);

    const sortSelect = screen.getByDisplayValue('Menor precio');
    fireEvent.change(sortSelect, { target: { value: 'desc' } });

    const discountSelect = screen.getByDisplayValue('No ordenar por descuento');
    fireEvent.change(discountSelect, { target: { value: 'desc' } });

    expect(await screen.findByText(/Paracetamol/i)).toBeInTheDocument();
    expect(screen.getByText(/Ibuprofeno/i)).toBeInTheDocument();
    expect(screen.getByText(/Diclofenaco/i)).toBeInTheDocument();
  });
});
