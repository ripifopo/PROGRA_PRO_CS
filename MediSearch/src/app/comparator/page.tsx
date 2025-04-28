'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FaTag, FaMapMarkerAlt, FaSync } from 'react-icons/fa';
import { useLoading } from '../../context/LoadingContext.tsx'; // Hook de carga global

// Regiones y comunas predefinidas para filtro (perfil del usuario)
const REGIONES_COMUNAS: Record<string, string[]> = {
  'Región Metropolitana': ['Santiago', 'Providencia', 'Las Condes', 'Maipú', 'Puente Alto'],
  'Valparaíso': ['Valparaíso', 'Viña del Mar', 'Quilpué'],
  'Biobío': ['Concepción', 'Talcahuano'],
  'Araucanía': ['Temuco', 'Padre Las Casas'],
  'Los Lagos': ['Puerto Montt', 'Osorno'],
  'Antofagasta': ['Antofagasta', 'Calama'],
};

export default function ComparatorPage() {
  const { setLoading } = useLoading();

  // Estados para filtros
  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');
  const [pharmacyFilter, setPharmacyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');

  // Estados de datos
  const [profileComuna, setProfileComuna] = useState('');
  const [profileRegion, setProfileRegion] = useState('');
  const [allMedicines, setAllMedicines] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Carga inicial de perfil y medicamentos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const profile = localStorage.getItem('userProfile');
      if (profile) {
        const parsed = JSON.parse(profile);
        setProfileComuna(parsed.comuna);
        setProfileRegion(parsed.region);
      }

      try {
        const res = await fetch('/api/medicines');
        const pharmacies = await res.json();

        const flatMedicines: any[] = [];

        pharmacies.forEach((pharmacy: any) => {
          const pharmacyName = pharmacy.pharmacy;
          const pharmacyCategories = pharmacy.categories || {};

          for (const [category, meds] of Object.entries(pharmacyCategories)) {
            (meds as any[]).forEach((med) => {
              flatMedicines.push({
                ...med,
                pharmacy: pharmacyName,
                category,
              });
            });
          }
        });

        setAllMedicines(flatMedicines);

        // Extrae todas las categorías únicas
        const allCategories = new Set(flatMedicines.map((m) => m.category));
        setCategories(Array.from(allCategories));
      } catch (error) {
        console.error('Error cargando medicamentos:', error);
        toast.error('Error al cargar medicamentos');
      } finally {
        setTimeout(() => {
          setReady(true);
          setLoading(false);
        }, 300);
      }
    };

    loadData();
  }, []);

  if (!ready) return null;

  // Reinicia filtros
  const resetFilters = () => {
    setSearch('');
    setPharmacyFilter('');
    setCategoryFilter('');
    setSort('asc');
    toast.info('Filtros reiniciados');
  };

  // Aplica los filtros y el orden
  const filteredMedicines = allMedicines
    .filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      (pharmacyFilter ? m.pharmacy === pharmacyFilter : true) &&
      (categoryFilter ? m.category === categoryFilter : true)
    )
    .sort((a, b) => {
      const priceA = parseInt((a.price || '0').replace(/[^\d]/g, ''), 10);
      const priceB = parseInt((b.price || '0').replace(/[^\d]/g, ''), 10);
      return sort === 'asc' ? priceA - priceB : priceB - priceA;
    });

  const minPrice = Math.min(
    ...allMedicines.map((m) => parseInt((m.price || '0').replace(/[^\d]/g, ''), 10))
  );

  return (
    <div className="container py-5">
      {/* Título */}
      <div className="text-center mb-4">
        <h1 className="display-5 fw-bold text-success">Comparador de Medicamentos</h1>
        <p className="text-muted">Busca y compara precios en farmacias de tu comuna</p>
      </div>

      {/* Perfil cargado */}
      {profileComuna && profileRegion && (
        <p className="text-center text-muted mb-3">
          Perfil: <strong>{profileComuna}, {profileRegion}</strong>
        </p>
      )}

      {/* Filtro por Región y Comuna */}
      <div className="row justify-content-center mb-3">
        <div className="col-md-4 mb-2">
          <select
            className="form-select"
            value={region}
            onChange={(e) => {
              setLoading(true);
              setRegion(e.target.value);
              setComuna('');
              setTimeout(() => setLoading(false), 400);
            }}
          >
            <option value="">Selecciona una región</option>
            {Object.keys(REGIONES_COMUNAS).map((reg) => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4 mb-2">
          <select
            className="form-select"
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            disabled={!region}
          >
            <option value="">Selecciona una comuna</option>
            {REGIONES_COMUNAS[region]?.map((com) => (
              <option key={com} value={com}>{com}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros de farmacia, categoría y orden */}
      <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
        <select className="form-select w-auto" value={pharmacyFilter} onChange={(e) => setPharmacyFilter(e.target.value)}>
          <option value="">Todas las farmacias</option>
          <option value="Farmacia Ahumada">Farmacia Ahumada</option>
          <option value="Cruz Verde">Cruz Verde</option>
          <option value="Salcobrand">Salcobrand</option>
        </select>

        <select className="form-select w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
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

      {/* Resultado de medicamentos */}
      <div className="row g-4">
        {filteredMedicines.length === 0 ? (
          <p className="text-center text-muted">No se encontraron medicamentos con los filtros aplicados.</p>
        ) : (
          filteredMedicines.map((med, index) => (
            <div key={index} className="col-sm-6 col-lg-4">
              <div className="card h-100 shadow-sm text-center border-0">
                <img
                  src={med.image || "https://via.placeholder.com/150"}
                  alt={med.name}
                  className="card-img-top p-3"
                  style={{ height: '120px', objectFit: 'contain' }}
                />
                <div className="card-body">
                  <h5 className="card-title text-success fw-bold">{med.name}</h5>
                  <p className="card-subtitle text-muted">{med.pharmacy}</p>
                  <p className="fs-5 fw-semibold text-dark">{med.price}</p>
                  {parseInt((med.price || '0').replace(/[^\d]/g, ''), 10) === minPrice && (
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
