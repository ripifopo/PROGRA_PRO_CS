'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FaSearch, FaTag, FaMapMarkerAlt, FaSync } from 'react-icons/fa';
import { useLoading } from '../../../context/LoadingContext';

const medicines = [
  { name: 'Paracetamol 500mg', pharmacy: 'Cruz Verde', price: 990, image: 'https://i.imgur.com/Nz8UvBX.png' },
  { name: 'Ibuprofeno 400mg', pharmacy: 'Salcobrand', price: 1250, image: 'https://i.imgur.com/J3oOXYb.png' },
  { name: 'Loratadina 10mg', pharmacy: 'Ahumada', price: 850, image: 'https://i.imgur.com/IX1Tm9B.png' },
  { name: 'Omeprazol 20mg', pharmacy: 'Cruz Verde', price: 1350, image: 'https://i.imgur.com/hChF4xO.png' },
  { name: 'Amoxicilina 500mg', pharmacy: 'Salcobrand', price: 1890, image: 'https://i.imgur.com/dZzSukG.png' },
];

export default function ComparatorPage() {
  const { setLoading } = useLoading();

  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');
  const [search, setSearch] = useState('');
  const [pharmacy, setPharmacy] = useState('');
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');

  // Cargar comuna y región desde el perfil
  useEffect(() => {
    setLoading(true);

    try {
      const stored = localStorage.getItem('userProfile');
      if (!stored) throw new Error();
      const parsed = JSON.parse(stored);
      if (!parsed.comuna || !parsed.region) throw new Error();

      setComuna(parsed.comuna);
      setRegion(parsed.region);
    } catch {
      toast.error('No se pudo obtener la ubicación desde tu perfil');
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const resetFilters = () => {
    setSearch('');
    setPharmacy('');
    setSort('asc');
    toast.info('Filtros reiniciados');
  };

  const filtered = medicines
    .filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      (pharmacy ? m.pharmacy === pharmacy : true)
    )
    .sort((a, b) => sort === 'asc' ? a.price - b.price : b.price - a.price);

  const minPrice = Math.min(...medicines.map(m => m.price));

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h1 className="display-5 fw-bold text-success">Comparador de Medicamentos</h1>
        <p className="text-muted">Busca y compara precios en farmacias de tu comuna</p>
      </div>

      <div className="d-flex justify-content-center mb-4">
        <div className="input-group w-75 shadow-sm">
          <span className="input-group-text bg-white"><FaSearch /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o principio activo..."
            value={search}
            onChange={(e) => {
              setLoading(true);
              setSearch(e.target.value);
              setTimeout(() => setLoading(false), 300);
            }}
          />
        </div>
      </div>

      <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
        <select className="form-select w-auto" value={pharmacy} onChange={(e) => setPharmacy(e.target.value)}>
          <option value="">Todas las farmacias</option>
          <option value="Cruz Verde">Cruz Verde</option>
          <option value="Salcobrand">Salcobrand</option>
          <option value="Ahumada">Ahumada</option>
        </select>

        <select className="form-select w-auto" value={sort} onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}>
          <option value="asc">Menor precio</option>
          <option value="desc">Mayor precio</option>
        </select>

        <Link href="/availability" className="btn btn-outline-success d-flex align-items-center gap-2">
          <FaMapMarkerAlt /> Farmacias cercanas
        </Link>

        <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={resetFilters}>
          <FaSync /> Reiniciar filtros
        </button>
      </div>

      {region && comuna && (
        <p className="text-center text-muted mb-4">
          Mostrando resultados para: <span className="text-success fw-semibold">{comuna}, {region}</span>
        </p>
      )}

      <div className="row g-4">
        {filtered.length === 0 ? (
          <p className="text-center text-muted">No se encontraron medicamentos con los filtros aplicados.</p>
        ) : (
          filtered.map((med, index) => (
            <div key={index} className="col-sm-6 col-lg-4">
              <div className="card h-100 shadow-sm text-center border-0">
                <img src={med.image} alt={med.name} className="card-img-top p-3" style={{ height: '120px', objectFit: 'contain' }} />
                <div className="card-body">
                  <h5 className="card-title text-success fw-bold">{med.name}</h5>
                  <p className="card-subtitle text-muted">{med.pharmacy}</p>
                  <p className="fs-5 fw-semibold text-dark">${med.price}</p>
                  {med.price === minPrice && (
                    <span className="badge bg-success text-light d-inline-flex align-items-center gap-1">
                      <FaTag /> Mejor precio
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
