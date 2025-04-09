// Archivo: src/app/index.tsx

'use client';

import { Capsule, HeartPulse, Search, BookmarkHeart } from 'react-bootstrap-icons';

// Página de inicio de MediSearch
export default function HomePage() {
  return (
    <div className="py-5 text-center">
      {/* Ícono decorativo */}
      <HeartPulse size={64} className="text-success mb-3" />

      {/* Título principal */}
      <h1 className="display-3 fw-semibold text-dark">Bienvenido a MediSearch</h1>

      {/* Slogan descriptivo */}
      <p className="lead text-muted mb-4">
        Compara precios y disponibilidad de medicamentos en farmacias cercanas.
      </p>

      {/* Botones con íconos */}
      <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
        <a href="/comparator" className="btn btn-outline-success btn-lg d-flex align-items-center gap-2">
          <Search /> Comparar precios
        </a>
        <a href="/profile" className="btn btn-outline-secondary btn-lg d-flex align-items-center gap-2">
          <BookmarkHeart /> Mi perfil
        </a>
      </div>

      {/* Mensaje secundario */}
      <div className="mt-5 text-muted">
        <Capsule size={40} className="mb-2 text-secondary" />
        <p>
          Encuentra las mejores opciones para tus tratamientos, ahorra dinero y mejora tu bienestar con MediSearch.
        </p>
      </div>
    </div>
  );
}
