// Archivo: src/app/layout.tsx

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css'; // Importa estilos de toast
import Script from 'next/script';
import type { Metadata } from 'next';
import { ToastContainer } from 'react-toastify';

// Información general del sitio para los motores de búsqueda
export const metadata: Metadata = {
  title: 'MediSearch - Comparador de Medicamentos',
  description: 'Compara precios y disponibilidad de medicamentos en farmacias cercanas.',
};

// Layout raíz: define estructura común para todas las páginas
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head />
      <body className="bg-white text-dark d-flex flex-column min-vh-100">
        {/* Barra de navegación superior */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
          <div className="container">
            <a className="navbar-brand fw-bold text-success" href="/">
              MediSearch
            </a>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#mainNavbar"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="mainNavbar">
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <a className="nav-link active" href="/">Inicio</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/comparator">Comparador</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/notifications">Notificaciones</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/profile">Perfil</a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Contenido específico de cada página */}
        <main className="container mt-4">{children}</main>

        {/* Toast notifications visuales */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />

        {/* Pie de página */}
        <footer className="bg-light text-center text-muted py-3 mt-auto border-top">
          <small>© {new Date().getFullYear()} MediSearch. Todos los derechos reservados.</small>
        </footer>

        {/* Bootstrap JS para navbar responsive */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
