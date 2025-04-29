'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLoading } from '../../../context/LoadingContext.tsx';

export default function CategoriesPage() {
  const { setLoading } = useLoading();
  const [categories, setCategories] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Capitaliza cada palabra
  const capitalizeWords = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
      {/* Botón Volver al Comparador */}
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

      {/* Lista de Categorías */}
      <div className="row justify-content-center g-4">
        {categories.map((category, index) => (
          <div key={index} className="col-12 col-md-6 col-lg-4">
            <Link
              href={`/comparator/categories/${encodeURIComponent(category)}`}
              className="text-decoration-none"
            >
              <div className="card h-100 shadow-sm border-0 text-center p-5 bg-light hover-shadow">
                <h5 className="card-title text-success fw-bold">
                  {capitalizeWords(category.replace(/-/g, ' '))}
                </h5>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 8px 20px rgba(0, 128, 0, 0.3);
          background-color: #e6f4ea;
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
}
