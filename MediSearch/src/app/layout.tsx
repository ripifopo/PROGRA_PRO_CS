// Archivo: src/app/layout.tsx

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './FullPageLoader.css';

import Script from 'next/script';
import type { Metadata } from 'next';
import { ToastContainer } from 'react-toastify';
import { LoadingProvider } from '../context/LoadingContext';
import { AuthProvider } from '../context/AuthContext'; // 🔐 Contexto de login/logout global
import Navbar from './components/Navbar'; // 🌐 Navbar visible en toda la app

export const metadata: Metadata = {
  title: 'MediSearch - Comparador de Medicamentos',
  description: 'Compara precios y disponibilidad de medicamentos en farmacias cercanas.',
};

// Layout general que aplica a TODAS las páginas (no hace falta importar en cada page)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head />
      <body className="bg-white text-dark d-flex flex-column min-vh-100">
        {/* Wrappers globales: loading + auth */}
        <LoadingProvider>
          <AuthProvider>
            {/* Navbar superior con lógica de sesión */}
            <Navbar />

            {/* Contenido principal */}
            <main className="container mt-4">{children}</main>

            {/* Toast de mensajes (éxito/error) */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              closeOnClick
              pauseOnHover
              draggable
              theme="colored"
            />

            {/* Footer */}
            <footer className="bg-light text-center text-muted py-3 mt-auto border-top">
              <small>© {new Date().getFullYear()} MediSearch. Todos los derechos reservados.</small>
            </footer>

            {/* JS Bootstrap funcional */}
            <Script
              src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
              strategy="afterInteractive"
            />
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
