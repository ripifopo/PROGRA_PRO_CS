// Archivo: src/app/comparator/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FaSearch, FaTag, FaMapMarkerAlt, FaSync } from 'react-icons/fa';
import { useLoading } from '../../../context/LoadingContext';

// Medicamentos de ejemplo (serán reemplazados por datos de la base de datos en producción)
const medicines = [
  { name: 'Paracetamol 500mg', pharmacy: 'Cruz Verde', price: 990, image: 'https://i.imgur.com/Nz8UvBX.png' },
  { name: 'Ibuprofeno 400mg', pharmacy: 'Salcobrand', price: 1250, image: 'https://i.imgur.com/J3oOXYb.png' },
  { name: 'Loratadina 10mg', pharmacy: 'Ahumada', price: 850, image: 'https://i.imgur.com/IX1Tm9B.png' },
  { name: 'Omeprazol 20mg', pharmacy: 'Cruz Verde', price: 1350, image: 'https://i.imgur.com/hChF4xO.png' },
  { name: 'Amoxicilina 500mg', pharmacy: 'Salcobrand', price: 1890, image: 'https://i.imgur.com/dZzSukG.png' },
];

export default function ComparatorPage() {
  const { setLoading } = useLoading(); // Usa el contexto de carga global

  // Estados para filtros y vista
  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');
  const [search, setSearch] = useState('');
  const [pharmacy, setPharmacy] = useState('');
  const [sort, setSort] = useState('asc');
  const [showModal, setShowModal] = useState(true);

  // Detecta la ubicación del usuario y realiza reverse geocoding
  const handleAcceptLocation = async () => {
    setLoading(true);

    try {
      if (!navigator.geolocation) {
        toast.error('Geolocalización no soportada por tu navegador');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await response.json();
          const address = data.address;

          const regionParsed =
            address.state ||
            address.region ||
            address['ISO3166-2-lvl4'] || '';

          const comunaParsed =
            address.city ||
            address.town ||
            address.village ||
            address.county ||
            address.municipality ||
            address.suburb || '';

          if (!regionParsed || !comunaParsed) {
            console.error('Reverse geocoding data:', address);
            toast.error('No fue posible detectar tu comuna o región');
            return;
          }

          // Guarda la información para que esté disponible globalmente
          localStorage.setItem('userLocation', JSON.stringify({ region: regionParsed, comuna: comunaParsed }));

          setRegion(regionParsed);
          setComuna(comunaParsed);
          setShowModal(false);
          toast.success('Ubicación detectada correctamente');
        },
        (error) => {
          toast.error('No se pudo obtener tu ubicación');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      toast.error('Error al detectar ubicación');
    } finally {
      setLoading(false);
    }
  };

  // Reinicia filtros
  const resetFilters = () => {
    setSearch('');
    setPharmacy('');
    setSort('asc');
    toast.info('Filtros reiniciados');
  };

  // Aplica filtros sobre los medicamentos
  const filtered = medicines
    .filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      (pharmacy ? m.pharmacy === pharmacy : true)
    )
    .sort((a, b) => (sort === 'asc' ? a.price - b.price : b.price - a.price));

  const minPrice = Math.min(...medicines.map((m) => m.price));

  return (
    <div className="container py-5">
      {/* Modal de ubicación */}
      {showModal && (
        <>
          <div className="modal show fade d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow border-0">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">Aceptar ubicación</h5>
                </div>
                <div className="modal-body">
                  <p className="text-muted">
                    Para mostrarte resultados relevantes en tu comuna, necesitamos acceder a tu ubicación actual.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-success"
                    onClick={handleAcceptLocation}
                  >
                    Detectar automáticamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Título principal */}
      <div className="text-center mb-4">
        <h1 className="display-5 fw-bold text-success">Comparador de Medicamentos</h1>
        <p className="text-muted">Busca y compara precios en farmacias de tu comuna</p>
      </div>

      {/* Buscador */}
      <div className="d-flex justify-content-center mb-4">
        <div className="input-group w-75 shadow-sm">
          <span className="input-group-text bg-white">
            <FaSearch />
          </span>
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

      {/* Filtros */}
      <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
        <select className="form-select w-auto" value={pharmacy} onChange={(e) => setPharmacy(e.target.value)}>
          <option value="">Todas las farmacias</option>
          <option value="Cruz Verde">Cruz Verde</option>
          <option value="Salcobrand">Salcobrand</option>
          <option value="Ahumada">Ahumada</option>
        </select>

        <select className="form-select w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="asc">Menor precio</option>
          <option value="desc">Mayor precio</option>
        </select>

        <Link href="/availability" className="btn btn-outline-success d-flex align-items-center gap-2">
          <FaMapMarkerAlt />
          Farmacias cercanas
        </Link>

        <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={resetFilters}>
          <FaSync />
          Reiniciar filtros
        </button>
      </div>

      {/* Ubicación detectada */}
      {region && comuna && (
        <p className="text-center text-muted mb-4">
          Mostrando resultados para: <span className="text-success fw-semibold">{comuna}, {region}</span>
        </p>
      )}

      {/* Resultados */}
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
