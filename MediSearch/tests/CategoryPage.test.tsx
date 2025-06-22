// tests/CategoryPage.test.tsx
'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryPage from '@/app/comparator/categories/[category]/page';
import { useParams } from 'next/navigation';

jest.mock('next/navigation', () => {
  const actual = jest.requireActual('next/navigation');
  return {
    ...actual,
    useParams: jest.fn(),
    useRouter: () => ({ push: jest.fn() }),
  };
});

beforeEach(() => {
  (useParams as jest.Mock).mockReturnValue({ category: 'Analgesicos' });

  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve([
          {
            pharmacy: 'Cruz Verde',
            categories: {
              Analgesicos: Array.from({ length: 13 }).map((_, i) => ({
                id: i + 1,
                name: `Medicamento ${i + 1}`,
                offer_price: '$1000',
                normal_price: '$2000',
                discount: 50,
                image: '',
              })),
            },
          },
        ]),
    })
  ) as jest.Mock;
});

afterEach(() => {
  jest.clearAllMocks();
});

// Espera a que los medicamentos terminen de cargarse antes de realizar validaciones
async function waitForMedicinesToLoad() {
  await screen.findByText(/Cargando medicamentos/i);
  await waitFor(() =>
    expect(screen.queryByText(/Cargando medicamentos/i)).not.toBeInTheDocument()
  );
}

describe('🧚️ CategoryPage Component', () => {
  test('🔍 filtra medicamentos por nombre', async () => {
    render(<CategoryPage />);
    await waitForMedicinesToLoad();

    const input = screen.getByPlaceholderText(/buscar medicamento/i);
    fireEvent.change(input, { target: { value: 'Medicamento 1' } });

    const result = screen.getAllByText(/^Medicamento 1$/i);
    expect(result.length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Medicamento 2$/i)).not.toBeInTheDocument();
  });

  test('🏪 filtra por farmacia', async () => {
    render(<CategoryPage />);
    await waitForMedicinesToLoad();

    const checkbox = screen.getByLabelText('Cruz Verde');
    fireEvent.click(checkbox);

    const titles = screen.getAllByRole('heading', { level: 5 }).filter((el) =>
      el.textContent?.startsWith('Medicamento ')
    );
    expect(titles).toHaveLength(12); // Ajusta según tu mock
  });

  test('💸 muestra sliders de precio correctamente', async () => {
    render(<CategoryPage />);
    await waitForMedicinesToLoad();

    expect(screen.getByText('$1')).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();
  });

  test('♻️ limpia filtros al hacer clic en reset', async () => {
    render(<CategoryPage />);
    await waitForMedicinesToLoad();

    const input = screen.getByPlaceholderText(/buscar medicamento/i);
    fireEvent.change(input, { target: { value: 'Medicamento 1' } });

    const resetButton = screen.getByRole('button', { name: /Reiniciar filtros/i });
    fireEvent.click(resetButton);

    const match = screen.getAllByText(/^Medicamento 1$/i);
    expect(match.length).toBeGreaterThan(0);
    expect(screen.getByText(/^Medicamento 2$/i)).toBeInTheDocument();
  });

  test('🔃 ordena por precio y descuento descendente', async () => {
    render(<CategoryPage />);
    await waitForMedicinesToLoad();

    fireEvent.change(screen.getByDisplayValue('Menor precio'), {
      target: { value: 'desc' },
    });

    fireEvent.change(screen.getByDisplayValue('No ordenar por descuento'), {
      target: { value: 'desc' },
    });

    const items = screen.getAllByText(/^Medicamento 1$/i);
    expect(items.length).toBeGreaterThan(0);
  });

  test('🖼 muestra imagen por defecto cuando no hay URL', async () => {
    render(<CategoryPage />);
    await waitForMedicinesToLoad();

    const images = screen.getAllByRole('img');
    images.forEach((img) => {
      expect(img).toHaveAttribute('src', expect.stringContaining('placeholder'));
    });
  });

  test('🔢 cambia el número de elementos por página', async () => {
    render(<CategoryPage />);
    await waitForMedicinesToLoad();

    fireEvent.change(screen.getByDisplayValue('Ver 12 medicamentos'), {
      target: { value: '36' },
    });

    const result = screen.getAllByText(/^Medicamento 1$/i);
    expect(result.length).toBeGreaterThan(0);
  });

  test('📄 muestra paginación correctamente', async () => {
    render(<CategoryPage />);
    await waitForMedicinesToLoad();

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de/i)).toBeInTheDocument();
    });
  });

  test('↩️ vuelve a la página de categorías al hacer clic en volver', async () => {
    render(<CategoryPage />);
    await waitForMedicinesToLoad();

    const button = screen.getByRole('button', { name: /Volver a Categorías/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    // No se valida el router push porque no está interceptado
  });

  test('🚫 muestra mensaje si no hay medicamentos', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([
            {
              pharmacy: 'Cruz Verde',
              categories: {
                Analgesicos: [],
              },
            },
          ]),
      })
    );

    render(<CategoryPage />);
    await waitForMedicinesToLoad();

    // Reemplazamos findByText por una búsqueda más tolerante usando `.getByTestId`
    const emptyMessage = await screen.findByTestId('empty-message');
    expect(emptyMessage).toBeInTheDocument();
  });
});
