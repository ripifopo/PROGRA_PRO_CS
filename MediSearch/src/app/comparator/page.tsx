// src/app/comparator/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FaSearch, FaTag, FaMapMarkerAlt, FaSync } from 'react-icons/fa';
import { useLoading } from '../../../context/LoadingContext.tsx';

// Regiones y comunas de ejemplo (reemplazar con datos reales de Chile si es necesario)
const REGIONES_COMUNAS: Record<string, string[]> = {
  'Región Metropolitana': ['Santiago', 'Providencia', 'Las Condes', 'Maipú', 'Puente Alto'],
  'Valparaíso': ['Valparaíso', 'Viña del Mar', 'Quilpué'],
  'Biobío': ['Concepción', 'Talcahuano'],
  'Araucanía': ['Temuco', 'Padre Las Casas'],
  'Los Lagos': ['Puerto Montt', 'Osorno'],
  'Antofagasta': ['Antofagasta', 'Calama'],
  // Agrega el resto de regiones y comunas reales aquí
};

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
  const [profileComuna, setProfileComuna] = useState('');
  const [profileRegion, setProfileRegion] = useState('');

  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      setProfileComuna(parsed.comuna);
      setProfileRegion(parsed.region);
    }
  }, []);

  const resetFilters = () => {
    setSearch('');
    setPharmacy('');
    setSort('asc');
    toast.info('Filtros reiniciados');
  };

  const filtered = medicines
    .filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      (pharmacy ? m.pharmacy === pharmacy : true)
    )
    .sort((a, b) => (sort === 'asc' ? a.price - b.price : b.price - a.price));

  const minPrice = Math.min(...medicines.map((m) => m.price));

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h1 className="display-5 fw-bold text-success">Comparador de Medicamentos</h1>
        <p className="text-muted">Busca y compara precios en farmacias de una comuna determinada</p>
      </div>

      {/* Información del perfil y ubicación actual */}
      {profileComuna && profileRegion && (
        <p className="text-center text-muted mb-3">
          Perfil: <strong>{profileComuna}, {profileRegion}</strong>
        </p>
      )}

      <div className="row justify-content-center mb-3">
        <div className="col-md-4 mb-2">
          <select className="form-select" value={region} onChange={(e) => {
            setRegion(e.target.value);
            setComuna('');
          }}>
            <option value="">Selecciona una región</option>
            {Object.keys(REGIONES_COMUNAS).map((reg) => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4 mb-2">
          <select className="form-select" value={comuna} onChange={(e) => setComuna(e.target.value)} disabled={!region}>
            <option value="">Selecciona una comuna</option>
            {REGIONES_COMUNAS[region]?.map((com) => (
              <option key={com} value={com}>{com}</option>
            ))}
          </select>
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
