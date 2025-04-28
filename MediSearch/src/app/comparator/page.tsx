'use client';

import Link from 'next/link';
import { FaPills } from 'react-icons/fa';

export default function ComparatorPage() {
  return (
    <div className="container d-flex flex-column align-items-center justify-content-center min-vh-100 text-center">
      {/* Título principal */}
      <h1 className="display-4 fw-bold text-success mb-3">
        Comparador de Medicamentos
      </h1>

      {/* Subtítulo */}
      <p className="lead text-muted mb-5">
        Encuentra los mejores precios y compara medicamentos entre las principales farmacias de Chile.
      </p>

      {/* Ícono decorativo grande */}
      <div className="mb-4">
        <FaPills size={80} className="text-success" />
      </div>

      {/* Botón para explorar categorías */}
      <Link href="/comparator/categories" className="btn btn-success btn-lg px-5 py-3 shadow">
        Explorar Categorías
      </Link>
    </div>
  );
}
