// Archivo: src/app/components/Navbar.tsx

'use client';

import Link from 'next/link';
import { FaBell } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext'; // Hook del contexto de autenticación

export default function Navbar() {
  const { isLoggedIn } = useAuth(); // Hook que indica si el usuario tiene sesión activa

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
      <div className="container">
        {/* Logo de PharmaSearch */}
        <a className="navbar-brand fw-bold text-success" href="/">PharmaSearch</a>

        {/* Botón para responsive */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menú colapsable */}
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active" href="/">Inicio</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/comparator">Comparador</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/profile">Perfil</Link>
            </li>

            {/* Solo se muestra si el usuario ha iniciado sesión */}
            {isLoggedIn && (
              <li className="nav-item">
                <Link className="nav-link" href="/alerts" title="Alertas">
                  <div
                    className="rounded-circle border border-success d-flex justify-content-center align-items-center"
                    style={{ width: '34px', height: '34px' }}
                  >
                    <FaBell size={16} color="#218754" />
                  </div>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
