// Archivo: app/comparator/page.tsx

'use client';

import { FaSearch, FaPills, FaInfoCircle } from 'react-icons/fa';
import Image from 'next/image';

// Página comparador de medicamentos
export default function ComparatorPage() {
  return (
    <main className="container py-5">
      {/* Título principal */}
      <h1 className="text-center mb-4">
        <FaPills className="me-2 text-success" />
        Comparador de Medicamentos
      </h1>

      <p className="text-center text-muted mb-5">
        Compara precios, disponibilidad y opciones para tus medicamentos en distintas farmacias.
      </p>

      {/* Filtro de búsqueda (funcionalidad futura) */}
      <div className="input-group mb-4 w-75 mx-auto">
        <input
          type="text"
          className="form-control"
          placeholder="Busca un medicamento..."
          aria-label="Buscar"
        />
        <button className="btn btn-outline-success" type="button">
          <FaSearch />
        </button>
      </div>

      {/* Tarjetas de medicamentos */}
      <div className="row g-4">
        {/* Tarjeta 1 */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow">
            <Image
              src="/medicine1.jpg" // Imagen guardada en /public
              width={500}
              height={300}
              alt="Paracetamol"
              className="card-img-top object-fit-cover"
            />
            <div className="card-body">
              <h5 className="card-title">Paracetamol 500mg</h5>
              <p className="card-text text-muted">Farmacia Salcobrand</p>
              <p className="fw-bold text-success">$1.200 CLP</p>
              <a href="#" className="btn btn-outline-success w-100">
                <FaInfoCircle className="me-2" /> Ver detalles
              </a>
            </div>
          </div>
        </div>

        {/* Tarjeta 2 */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow">
            <Image
              src="/medicine2.jpg"
              width={500}
              height={300}
              alt="Ibuprofeno"
              className="card-img-top object-fit-cover"
            />
            <div className="card-body">
              <h5 className="card-title">Ibuprofeno 400mg</h5>
              <p className="card-text text-muted">Farmacia Cruz Verde</p>
              <p className="fw-bold text-success">$1.800 CLP</p>
              <a href="#" className="btn btn-outline-success w-100">
                <FaInfoCircle className="me-2" /> Ver detalles
              </a>
            </div>
          </div>
        </div>

        {/* Más tarjetas aquí */}
      </div>
    </main>
  );
}
