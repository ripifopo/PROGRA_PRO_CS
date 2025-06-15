// Archivo: src/app/layout.tsx

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './FullPageLoader.css';

import Script from 'next/script';
import type { Metadata } from 'next';
import { ToastContainer } from 'react-toastify';
import { LoadingProvider } from '../context/LoadingContext';
import { AuthProvider } from '../context/AuthContext';
import Navbar from './components/Navbar';

export const metadata: Metadata = {
  title: 'PharmaSearch - Comparador de Medicamentos',
  description: 'Compara precios y disponibilidad de medicamentos en farmacias cercanas.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head />
      <body className="bg-white text-dark d-flex flex-column min-vh-100">
        <LoadingProvider>
          <AuthProvider>
            <Navbar />

            <main className="container mt-4">{children}</main>

            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              closeOnClick
              pauseOnHover
              draggable
              theme="colored"
            />

            <footer className="bg-light text-center text-muted py-3 mt-auto border-top">
              <small>© {new Date().getFullYear()} PharmaSearch. Todos los derechos reservados.</small>
            </footer>

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
