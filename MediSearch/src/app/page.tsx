// Archivo: src/app/index.tsx

'use client';

import { Capsule, HeartPulse, Search, BookmarkHeart, GeoAlt } from 'react-bootstrap-icons';

// Página de inicio de MediSearch
export default function HomePage() {
  return (
    <div className="py-5 text-center container">
      {/* Ícono principal decorativo */}
      <HeartPulse size={70} className="text-success mb-4" />

      {/* Título principal */}
      <h1 className="display-3 fw-bold text-dark mb-3">Bienvenido a MediSearch</h1>

      {/* Slogan descriptivo */}
      <p className="lead text-muted mb-5">
        Compara precios, consulta disponibilidad y encuentra tu farmacia más cercana.
      </p>

      {/* Botones de acción */}
      <div className="d-flex justify-content-center gap-3 flex-wrap">
        <a href="/comparator" className="btn btn-success btn-lg d-flex align-items-center gap-2 shadow">
          <Search size={24} /> Comparar precios
        </a>
        <a href="/availability" className="btn btn-primary btn-lg d-flex align-items-center gap-2 shadow">
          <GeoAlt size={24} /> Farmacias cercanas
        </a>
        <a href="/profile" className="btn btn-outline-secondary btn-lg d-flex align-items-center gap-2 shadow">
          <BookmarkHeart size={24} /> Mi perfil
        </a>
      </div>

      {/* Mensaje final */}
      <div className="mt-5 text-muted">
        <Capsule size={40} className="mb-3 text-secondary" />
        <p className="mb-0">
          MediSearch te ayuda a cuidar tu salud, optimizar tus tratamientos y ahorrar en cada compra.
        </p>
      </div>
    </div>
  );
}