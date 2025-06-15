'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLoading } from '../../../context/LoadingContext.tsx';

export default function CategoriesPage() {
  const { setLoading } = useLoading();
  const [categories, setCategories] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Capitaliza cada palabra del nombre de la categoría
  const capitalizeWords = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Carga las categorías desde la API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('Error cargando categorías:', error);
      } finally {
        setReady(true);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (!ready) return null;

  return (
    <div className="container py-5">
      {/* Botón para volver al comparador */}
      <div className="mb-4">
        <Link href="/comparator" className="btn btn-outline-success">
          ← Volver al Comparador
        </Link>
      </div>

      {/* Título principal */}
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-success">Categorías de Medicamentos</h1>
        <p className="text-muted">Selecciona una categoría para explorar los medicamentos disponibles</p>
      </div>

      {/* Tarjetas de categorías */}
      <div className="row justify-content-center g-4">
        {categories.map((category, index) => (
          <div key={index} className="col-12 col-md-6 col-lg-4">
            <Link
              href={`/comparator/categories/${encodeURIComponent(category)}`}
              className="text-decoration-none"
            >
              <div className="card h-100 shadow-sm border-0 text-center p-5 bg-light hover-effect rounded-4">
                <h5 className="card-title text-success fw-bold">
                  {capitalizeWords(category.replace(/-/g, ' '))}
                </h5>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Estilos hover y animación */}
      <style jsx>{`
        .hover-effect {
          transition: all 0.3s ease;
        }
        .hover-effect:hover {
          transform: scale(1.03);
          box-shadow: 0 12px 30px rgba(0, 128, 0, 0.2);
          background-color: #e6f4ea;
        }
      `}</style>
    </div>
  );
}
