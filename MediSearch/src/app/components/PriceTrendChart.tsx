'use client';

import { useEffect, useState } from 'react';
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

// Registro de módulos necesarios para Chart.js
ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, CategoryScale, Legend);

// Props del componente, incluye modo compacto para versión resumida
interface PriceTrendChartProps {
  medicineId: number;
  pharmacy: string;
  compact?: boolean;
}

// Estructura del historial que viene desde la API
interface PriceSnapshot {
  date: string;
  offer_price: number;
  normal_price: number;
}

export default function PriceTrendChart({ medicineId, pharmacy, compact = false }: PriceTrendChartProps) {
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);

  // Al montar, se consulta el historial desde la API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/history/${medicineId}?pharmacy=${encodeURIComponent(pharmacy)}`);
        const data = await res.json();
        setSnapshots(data);
      } catch {
        console.error('Error cargando historial de precios');
      }
    };

    fetchHistory();
  }, [medicineId, pharmacy]);

  // Si no hay datos, se muestra mensaje informativo
  if (!snapshots.length) {
    return (
      <div className="mt-3 text-muted" style={{ fontSize: compact ? '0.85rem' : '1rem' }}>
        <p>No hay historial de precios disponible para este medicamento.</p>
        {!compact && <p><em>Revisa otras opciones o vuelve a intentarlo más tarde.</em></p>}
      </div>
    );
  }

  // Formatea la fecha como "10 de junio de 2025"
  const formatFecha = (raw: string): string => {
    const [año, mes, día] = raw.split('_')[0].split('-');
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${día} de ${meses[parseInt(mes) - 1]} de ${año}`;
  };

  // Datos del gráfico: fechas, precios normales y precios en oferta
  const data = {
    labels: snapshots.map(s => formatFecha(s.date)),
    datasets: [
      {
        label: 'Precio normal',
        data: snapshots.map(s => s.normal_price),
        borderColor: 'gray',
        backgroundColor: 'transparent',
        tension: 0.3,
      },
      {
        label: 'Precio oferta',
        data: snapshots.map(s => s.offer_price),
        borderColor: 'green',
        backgroundColor: 'transparent',
        tension: 0.3,
      }
    ]
  };

  // Configuración visual del gráfico
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: compact ? 'bottom' as const : 'top' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: compact ? 10 : 12,
          }
        }
      },
      title: {
        display: !compact,
        text: 'Tendencia de precios por fecha',
        font: {
          size: 18,
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `$${context.parsed.y.toLocaleString('es-CL')}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function (value: string | number) {
            if (typeof value === 'number') {
              return `$${value.toLocaleString('es-CL')}`;
            }
            return value;
          },
          font: {
            size: compact ? 10 : 12,
          }
        }
      },
      x: {
        ticks: {
          maxRotation: compact ? 45 : 0,
          minRotation: compact ? 45 : 0,
          font: {
            size: compact ? 9 : 11,
          }
        }
      }
    }
  };

  // Render final del gráfico con altura ajustada según el modo
  return (
    <div style={{ height: compact ? '180px' : '420px' }}>
      <Line data={data} options={options} />
    </div>
  );
}
