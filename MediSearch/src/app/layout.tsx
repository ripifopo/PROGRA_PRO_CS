// Archivo: src/app/layout.tsx

import 'bootstrap/dist/css/bootstrap.min.css';
import Script from 'next/script';
import type { Metadata } from 'next';

// Metadata del sitio
export const metadata: Metadata = {
  title: 'MediSearch - Comparador de Medicamentos',
  description: 'Compara precios y disponibilidad de medicamentos en farmacias cercanas.',
};

// Componente layout general del sitio
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head />
      <body className="bg-light">
        {/* Barra de navegación principal */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
          <div className="container-fluid">
            {/* Logo o nombre del sitio */}
            <a className="navbar-brand fw-bold" href="/">MediSearch</a>
            {/* Botón para menú responsive */}
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#mainNavbar"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            {/* Enlaces del menú */}
            <div className="collapse navbar-collapse" id="mainNavbar">
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <a className="nav-link active" href="/">Inicio</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/comparator">Comparador</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/availability">Disponibilidad</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/alerts">Alertas</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/treatments">Tratamientos</a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Contenido de cada página */}
        <main className="container mt-4">{children}</main>

        {/* Bootstrap JS para funcionalidad del menú responsive */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
