// Archivo: src/app/page.tsx

'use client';

// Página de inicio principal (usa automáticamente el layout.tsx global)
export default function HomePage() {
  return (
    <div className="py-5 text-center">
      <h1 className="display-4 text-primary">Bienvenido a MediSearch</h1>
      <p className="lead">
        Compara precios y disponibilidad de medicamentos en farmacias cercanas.
      </p>
      <a href="/comparator" className="btn btn-success btn-lg mt-3">
        Ir al comparador
      </a>
    </div>
  );
}


