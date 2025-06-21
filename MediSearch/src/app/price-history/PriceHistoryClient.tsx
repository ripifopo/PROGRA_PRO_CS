'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  CategoryScale,
  Legend,
} from 'chart.js';
import { Button, Container, Form, Badge, Card } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, CategoryScale, Legend);

interface Medicine {
  id: number;
  name: string;
  pharmacy: string;
  category: string;
  offer_price?: number;
  normal_price?: number;
}

interface PriceSnapshot {
  date: string;
  offer_price: number;
  normal_price: number;
}

interface SelectedMedicine extends Medicine {
  history: PriceSnapshot[];
}

export default function PriceHistoryClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [results, setResults] = useState<Medicine[]>([]);
  const [selected, setSelected] = useState<SelectedMedicine[]>([]);
  const maxSelected = 3;

  const medicineIdParam = searchParams.get('medicineId') || '';
  const pharmacyParam = searchParams.get('pharmacy') || '';
  const nameParam = searchParams.get('name') || '';
  const categoryParam = searchParams.get('category') || '';
  const fromMedicine = searchParams.get('fromMedicine') === 'true';

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await fetch('/api/medicines');
        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error('Datos recibidos no son un arreglo:', data);
          setAllMedicines([]);
          return;
        }

        const meds: Medicine[] = data.flatMap((pharmacy: any) =>
          Object.entries(pharmacy.categories || {}).flatMap(([cat, meds]) =>
            Array.isArray(meds)
              ? meds.map((med: any) => ({
                  id: med.id,
                  name: med.name,
                  pharmacy: pharmacy.pharmacy,
                  category: cat,
                  offer_price: med.offer_price,
                  normal_price: med.normal_price,
                }))
              : []
          )
        );
        setAllMedicines(meds);
      } catch (error) {
        console.error('Error cargando medicamentos:', error);
      }
    };
    fetchMedicines();
  }, []);

  const cleanDuplicates = (arr: SelectedMedicine[]) => {
    const seen = new Set<string>();
    return arr.filter(med => {
      const key = `${med.id}-${med.pharmacy}-${med.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  useEffect(() => {
    if (
      fromMedicine &&
      medicineIdParam &&
      pharmacyParam &&
      nameParam &&
      categoryParam &&
      allMedicines.length > 0 &&
      selected.length === 0
    ) {
      const med = allMedicines.find(
        (m) =>
          Number(m.id) === parseInt(medicineIdParam) &&
          m.pharmacy.toLowerCase() === pharmacyParam.toLowerCase() &&
          m.name.toLowerCase() === nameParam.toLowerCase()
      );
      if (med) {
        addSelected(med);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromMedicine, medicineIdParam, pharmacyParam, nameParam, categoryParam, allMedicines]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const lowerSearch = search.toLowerCase();
    const filtered = allMedicines.filter(
      (med) =>
        med.name?.toLowerCase().includes(lowerSearch) &&
        !selected.some(
          (sel) => Number(sel.id) === Number(med.id) && sel.pharmacy === med.pharmacy && sel.name === med.name
        )
    );
    setResults(filtered.slice(0, 10));
  }, [search, allMedicines, selected]);

  const addSelected = async (med: Medicine) => {
    if (selected.length >= maxSelected) {
      alert(`Solo puedes seleccionar máximo ${maxSelected} medicamentos.`);
      return;
    }

    const isAlreadySelected = selected.some(
      (s) => Number(s.id) === Number(med.id) && s.pharmacy === med.pharmacy && s.name === med.name
    );
    if (isAlreadySelected) return;

    try {
      const res = await fetch(
        `/api/history/${med.id}?pharmacy=${encodeURIComponent(med.pharmacy)}`
      );
      const history: PriceSnapshot[] = await res.json();

      setSelected(prev => {
        const updated = [...prev, { ...med, history }];
        return cleanDuplicates(updated);
      });

      setSearch('');
      setResults([]);
    } catch {
      alert('Error al cargar historial de precios');
    }
  };

  const removeSelected = (id: number, pharmacy: string) => {
    setSelected(selected.filter((med) => !(Number(med.id) === id && med.pharmacy === pharmacy)));
  };

  const formatFecha = (raw: string): string => {
    const [year, month, day] = raw.split('_')[0].split('-');
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    return `${day} de ${meses[parseInt(month) - 1]} de ${year}`;
  };

  const data = {
    labels: selected.length > 0 ? selected[0].history.map((h) => formatFecha(h.date)) : [],
    datasets: selected.map((med, i) => ({
      label: `${med.name} (${med.pharmacy})`,
      data: med.history.map((h) => h.offer_price),
      borderColor: ['#3b82f6', '#f59e0b', '#8b5cf6'][i % 3],
      backgroundColor: 'transparent',
      tension: 0.3,
      borderDash: selected.length > 1 ? [6, 4] : [],
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: false,
    })),
  };

  const allPrices = selected.flatMap(med => med.history.map(h => h.offer_price));
  const minPrice = Math.min(...allPrices, 0);
  const maxPrice = Math.max(...allPrices, 1000);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: 'Tendencia de precios históricos',
        font: { size: 24, weight: 'bold' as const },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `$${ctx.parsed.y.toLocaleString('es-CL')}`,
        },
        bodyFont: { weight: 'bold' as const },
      },
    },
    scales: {
      y: {
        min: minPrice - 50,
        max: maxPrice + 50,
        ticks: {
          callback: (tickValue: string | number) => {
            if (typeof tickValue === 'number') {
              return `$${tickValue.toLocaleString('es-CL')}`;
            }
            return tickValue;
          },
          font: { size: 12 },
        },
        grid: { color: '#e0e0e0' },
      },
      x: {
        ticks: {
          font: { size: 12 },
          maxRotation: 45,
          minRotation: 45,
          display: false,
        },
        grid: { display: false },
      },
    },
  };

  return (
    <Container className="py-4" style={{ maxWidth: '960px' }}>
      <h2 className="text-success fw-bold mb-4 text-center">
        Precios Históricos — Selecciona hasta {maxSelected}
      </h2>

      {(medicineIdParam && pharmacyParam && nameParam && categoryParam) && (
        <div className="mb-4 text-center">
          <Button
            variant="outline-primary"
            onClick={() =>
              router.push(
                `/comparator/categories/${categoryParam}/${encodeURIComponent(
                  medicineIdParam
                )}`
              )
            }
          >
            ← Volver al medicamento
          </Button>
        </div>
      )}

      <Form.Group controlId="searchMedicine" className="mb-4">
        <Form.Control
          type="text"
          placeholder="Busca medicamento por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          style={{
            fontSize: '1.1rem',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            borderColor: '#3b82f6',
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.3)',
          }}
        />
      </Form.Group>

      {results.length > 0 && (
        <div
          className="mb-4 border rounded p-3 bg-light shadow-sm"
          style={{ maxHeight: 260, overflowY: 'auto' }}
        >
          {results.map((med) => (
            <Card
              key={`${med.id}-${med.pharmacy}`}
              className="mb-2 shadow-sm"
              style={{ cursor: 'pointer' }}
              onClick={() => addSelected(med)}
            >
              <Card.Body className="d-flex justify-content-between align-items-center p-3">
                <div>
                  <h6 className="mb-1 fw-semibold">{med.name}</h6>
                  <small className="text-muted">
                    {med.pharmacy} &mdash; <em>{med.category}</em>
                  </small>
                </div>
                <Badge
                  bg="success"
                  pill
                  style={{ fontSize: '1rem', padding: '0.5rem 0.75rem' }}
                >
                  {med.offer_price !== undefined && med.offer_price !== null
                    ? med.offer_price.toLocaleString('es-CL')
                    : '-'}
                </Badge>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {selected.length > 0 ? (
        <>
          <div className="mb-3 d-flex flex-wrap gap-2 justify-content-center">
            {selected.map((med, index) => (
              <Badge
                key={`${med.id}-${med.pharmacy}-${index}`}
                bg="primary"
                pill
                className="d-flex align-items-center gap-2"
                style={{
                  fontSize: '1rem',
                  cursor: 'default',
                  userSelect: 'none',
                  padding: '0.5rem 1rem',
                }}
              >
                {med.name} ({med.pharmacy})
                <FaTimes
                  style={{ cursor: 'pointer', marginLeft: 6 }}
                  onClick={() => removeSelected(Number(med.id), med.pharmacy)}
                  title="Quitar medicamento"
                />
              </Badge>
            ))}
          </div>

          <div
            className="p-3 bg-white rounded shadow-sm mx-auto"
            style={{ maxWidth: 900, height: '480px' }}
          >
            <Line data={data} options={options} />
          </div>
        </>
      ) : (
        <p className="text-center text-muted fst-italic">
          Busca y selecciona medicamentos para ver sus precios históricos.
        </p>
      )}
    </Container>
  );
}
