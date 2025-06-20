'use client';

import { useEffect, useState } from 'react';
import PriceTrendChart from './PriceTrendChart';

interface Medicine {
  _id: number;
  name: string;
  pharmacy: string;
  category: string;
}

export default function SimilarAlternatives({ medicineId, category, name }: { medicineId: number; category: string; name: string }) {
  const [alternatives, setAlternatives] = useState<Medicine[]>([]);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const res = await fetch('/api/medicines');
        const all: Medicine[] = await res.json();

        const originalName = name?.toLowerCase() || '';
        const originalWords = originalName.split(/\s+/);

        const similar = all.filter((alt) => {
          if (!alt.name || !alt.category) return false;
          if (alt._id === medicineId) return false;
          if (alt.category.toLowerCase() !== category.toLowerCase()) return false;

          const altWords = alt.name.toLowerCase().split(/\s+/);
          return altWords.some(word => originalWords.includes(word));
        });

        setAlternatives(similar.slice(0, 3)); // máximo 3 alternativas
      } catch (error) {
        console.error('Error cargando alternativas similares', error);
      }
    };

    fetchSimilar();
  }, [medicineId, category, name]);

  if (!alternatives.length) {
    return <p className="text-muted mt-3">No se encontraron alternativas similares.</p>;
  }

  return (
    <div className="row mt-3">
      {alternatives.map((alt) => (
        <div key={alt._id} className="col-md-4 mb-3">
          <div className="border rounded p-3 shadow-sm h-100">
            <h6 className="mb-2">{alt.name}</h6>
            <p className="mb-2 text-muted">Farmacia: {alt.pharmacy}</p>
            <PriceTrendChart medicineId={alt._id} pharmacy={alt.pharmacy} compact={true} />
          </div>
        </div>
      ))}
    </div>
  );
}
