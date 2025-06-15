'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPills, FaSearch } from 'react-icons/fa';
import Link from 'next/link';

export default function ComparatorPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [allMedicines, setAllMedicines] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await fetch('/api/medicines');
        const data = await res.json();
        setAllMedicines(data);
      } catch (error) {
        console.error('Error cargando medicamentos:', error);
      }
    };

    fetchMedicines();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const lowerSearch = search.toLowerCase();

    const matched = allMedicines.flatMap((pharmacy: any) => {
      return Object.entries(pharmacy.categories || {}).flatMap(([cat, meds]) => {
        if (!Array.isArray(meds)) return [];

        return meds
          .filter((med: any) =>
            med.name?.toLowerCase().includes(lowerSearch)
          )
          .map((med: any) => ({
            ...med,
            pharmacy: pharmacy.pharmacy,
            category: cat,
          }));
      });
    });

    setResults(matched.slice(0, 6));
  }, [search, allMedicines]);

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center min-vh-100 text-center">
      <h1 className="display-4 fw-bold text-success mb-3">Comparador de Medicamentos</h1>
      <p className="lead text-muted mb-4">
        Encuentra los mejores precios y compara medicamentos entre las principales farmacias de Chile.
      </p>

      {/* Input de búsqueda */}
      <div className="mb-4 w-100 d-flex justify-content-center">
        <div className="input-group w-75" style={{ maxWidth: '600px' }}>
          <input
            type="text"
            className="form-control border-success"
            placeholder="Buscar medicamento por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn btn-success"
            onClick={() => {
              if (results.length > 0) {
                const med = results[0];
                router.push(`/comparator/categories/${encodeURIComponent(med.category)}/${encodeURIComponent(med.id || '0')}`);
              }
            }}
          >
            <FaSearch />
          </button>
        </div>
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="w-100 d-flex flex-column align-items-center mb-5">
          {results.map((med, index) => (
            <Link
              key={index}
              href={`/comparator/categories/${encodeURIComponent(med.category)}/${encodeURIComponent(med.id || '0')}`}
              className="text-decoration-none mb-3"
              style={{ width: '100%', maxWidth: '900px' }}
            >
              <div className="d-flex flex-column flex-md-row align-items-center justify-content-between bg-light p-3 rounded shadow-sm">
                <div className="d-flex align-items-center gap-3 text-start w-100">
                  <img
                    src={med.image || 'https://via.placeholder.com/100'}
                    alt={med.name}
                    style={{ width: '90px', height: '90px', objectFit: 'contain' }}
                  />
                  <div className="flex-grow-1">
                    <h6 className="text-success fw-bold mb-1 text-uppercase">{med.name}</h6>
                    <p className="mb-0"><strong>Farmacia:</strong> {med.pharmacy}</p>
                    <p className="mb-0"><strong>Categoría:</strong> {med.category}</p>
                  </div>
                </div>

                {/* Botón visible solo en pantallas medianas o mayores */}
                <div className="d-none d-md-block">
                  <span className="btn btn-outline-primary rounded-pill px-4 py-1 fw-semibold">
                    Ver detalle
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Si no hay resultados activos */}
      {results.length === 0 && (
        <>
          <FaPills size={80} className="text-success mb-3" />
          <Link
            href="/comparator/categories"
            className="btn btn-success btn-lg px-5 py-3 shadow"
          >
            Explorar Categorías
          </Link>
        </>
      )}
    </div>
  );
}
