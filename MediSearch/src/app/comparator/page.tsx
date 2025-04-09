'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaSearch, FaTag, FaMapMarkerAlt, FaSync } from 'react-icons/fa';

const medicines = [
  { name: 'Paracetamol 500mg', pharmacy: 'Cruz Verde', price: 990, image: 'https://i.imgur.com/Nz8UvBX.png' },
  { name: 'Ibuprofeno 400mg', pharmacy: 'Salcobrand', price: 1250, image: 'https://i.imgur.com/J3oOXYb.png' },
  { name: 'Loratadina 10mg', pharmacy: 'Ahumada', price: 850, image: 'https://i.imgur.com/IX1Tm9B.png' },
  { name: 'Omeprazol 20mg', pharmacy: 'Cruz Verde', price: 1350, image: 'https://i.imgur.com/hChF4xO.png' },
  { name: 'Amoxicilina 500mg', pharmacy: 'Salcobrand', price: 1890, image: 'https://i.imgur.com/dZzSukG.png' },
];

export default function ComparatorPage() {
  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');
  const [search, setSearch] = useState('');
  const [pharmacy, setPharmacy] = useState('');
  const [sort, setSort] = useState('asc');

  const [showModal, setShowModal] = useState(true);
  const [tempRegion, setTempRegion] = useState('');
  const [tempComuna, setTempComuna] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      const { region, comuna } = JSON.parse(stored);
      setRegion(region);
      setComuna(comuna);
      setShowModal(false);
    }
  }, []);

  const handleAcceptLocation = () => {
    if (tempRegion && tempComuna) {
      localStorage.setItem('userLocation', JSON.stringify({ region: tempRegion, comuna: tempComuna }));
      setRegion(tempRegion);
      setComuna(tempComuna);
      setShowModal(false);
    }
  };

  const minPrice = Math.min(...medicines.map((m) => m.price));
  const filtered = medicines
    .filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      (pharmacy ? m.pharmacy === pharmacy : true)
    )
    .sort((a, b) => (sort === 'asc' ? a.price - b.price : b.price - a.price));

  const resetFilters = () => {
    setSearch('');
    setPharmacy('');
    setSort('asc');
  };

  return (
    <div className="container py-5">
      {/* MODAL UBICACIÓN */}
      {showModal && (
        <div className="modal show fade d-block" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title">Selecciona tu ubicación</h5>
              </div>
              <div className="modal-body">
                <p className="text-muted small">
                  Esto nos ayuda a mostrarte disponibilidad en tu comuna.
                </p>
                <div className="mb-3">
                  <label className="form-label">Región</label>
                  <select
                    className="form-select"
                    value={tempRegion}
                    onChange={(e) => setTempRegion(e.target.value)}
                  >
                    <option value="">Selecciona una región</option>
                    <option value="Región Metropolitana">Región Metropolitana</option>
                    <option value="Valparaíso">Valparaíso</option>
                    <option value="Biobío">Biobío</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Comuna</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Ej: Las Condes"
                    value={tempComuna}
                    onChange={(e) => setTempComuna(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  onClick={handleAcceptLocation}
                  className="btn btn-success"
                  disabled={!tempRegion || !tempComuna}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}

      {/* Título */}
      <div className="text-center mb-4">
        <h1 className="display-5 fw-bold text-success">Comparador de Medicamentos</h1>
        <p className="text-muted">Busca, filtra y encuentra los mejores precios en farmacias chilenas</p>
      </div>

      {/* Buscador */}
      <div className="d-flex justify-content-center mb-4">
        <div className="input-group w-75 w-md-50 shadow-sm">
          <span className="input-group-text bg-white"><FaSearch /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o principio activo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
        <select
          className="form-select w-auto"
          value={pharmacy}
          onChange={(e) => setPharmacy(e.target.value)}
        >
          <option value="">Todas las farmacias</option>
          <option value="Cruz Verde">Cruz Verde</option>
          <option value="Salcobrand">Salcobrand</option>
          <option value="Ahumada">Ahumada</option>
        </select>

        <select
          className="form-select w-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="asc">Menor precio</option>
          <option value="desc">Mayor precio</option>
        </select>

        <Link href="/availability" className="btn btn-success d-flex align-items-center gap-2">
          <FaMapMarkerAlt />
          Farmacias cercanas
        </Link>

        <button className="btn btn-outline-danger d-flex align-items-center gap-2" onClick={resetFilters}>
          <FaSync />
          Reiniciar filtros
        </button>
      </div>

      {/* Ubicación actual */}
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
              <div className="card h-100 shadow-sm text-center">
                <img src={med.image} alt={med.name} className="card-img-top p-3" style={{ height: '120px', objectFit: 'contain' }} />
                <div className="card-body">
                  <h5 className="card-title text-success fw-bold">{med.name}</h5>
                  <p className="card-subtitle mb-1 text-muted">{med.pharmacy}</p>
                  <p className="card-text fs-5 fw-semibold text-dark">${med.price}</p>
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
