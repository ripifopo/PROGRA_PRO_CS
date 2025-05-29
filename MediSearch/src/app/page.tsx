'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HeartPulse,
  Search,
  GeoAlt,
  BookmarkHeart,
  Capsule,
  ChevronLeft,
  ChevronRight
} from 'react-bootstrap-icons';
import { Button } from 'react-bootstrap';

// Interfaz del medicamento frecuente
interface FrequentMedicine {
  userEmail: string;
  medicineName: string;
  pharmacy: string;
  category: string;
  imageUrl?: string;
  pharmacyUrl?: string;
  savedAt: string;
}

// Función para capitalizar texto
const capitalizeCategory = (text: string) => {
  return decodeURIComponent(text)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function HomePage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [frequentList, setFrequentList] = useState<FrequentMedicine[]>([]);
  const [loading, setLoading] = useState(false);

  // Obtener medicamentos frecuentes desde la API
  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (!stored) return;

    const { email } = JSON.parse(stored);
    if (!email) return;

    const fetchFrequent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/frequent?email=${email}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFrequentList(data);
      } catch {
        console.error('No se pudieron obtener los medicamentos frecuentes.');
      } finally {
        setLoading(false);
      }
    };

    fetchFrequent();
  }, []);

  // Función para desplazar horizontalmente
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="py-5 text-center container">
      <HeartPulse size={70} className="text-success mb-4" />
      <h1 className="display-3 fw-bold text-success mb-3">Bienvenido a MediSearch</h1>
      <p className="lead text-muted mb-5">
        Compara precios, consulta disponibilidad y encuentra tu farmacia más cercana.
      </p>

      {/* Botones de navegación */}
      <div className="d-flex justify-content-center gap-3 flex-wrap mb-4">
        <a href="/comparator" className="btn btn-success btn-lg d-flex align-items-center gap-2 shadow">
          <Search size={24} /> Comparar precios
        </a>
        <a href="/availability" className="btn btn-primary btn-lg d-flex align-items-center gap-2 shadow">
          <GeoAlt size={24} /> Farmacias cercanas
        </a>
        <a href="/profile" className="btn btn-outline-secondary btn-lg d-flex align-items-center gap-2 shadow">
          <BookmarkHeart size={24} /> Mi perfil
        </a>
      </div>

      {/* Módulo de medicamentos frecuentes */}
      {frequentList.length > 0 && (
        <div className="mt-5">
          <p className="text-muted fst-italic mb-4 fs-5">
            Basado en tus búsquedas, podrías necesitar nuevamente...
          </p>

          <div className="position-relative">
            {frequentList.length > 5 && (
              <Button
                variant="light"
                onClick={() => handleScroll('left')}
                className="position-absolute top-50 start-0 translate-middle-y z-2"
              >
                <ChevronLeft size={24} />
              </Button>
            )}

            <div
              ref={scrollRef}
              className="d-flex gap-4 pb-3 mx-auto justify-content-start overflow-auto"
              style={{
                scrollBehavior: 'smooth',
                width: frequentList.length <= 5 ? `${frequentList.length * 220}px` : '100%',
                transition: 'width 0.3s ease-in-out'
              }}
            >
              {frequentList.map((med, index) => (
                <div
                  key={index}
                  className="rounded shadow-sm bg-white text-start p-3"
                  style={{ minWidth: '200px', maxWidth: '200px', flex: '0 0 auto' }}
                >
                  <img
                    src={med.imageUrl || 'https://via.placeholder.com/200'}
                    alt={med.medicineName}
                    className="rounded mb-2"
                    style={{ width: '100%', height: '120px', objectFit: 'contain' }}
                  />
                  <h6 className="text-success fw-bold text-uppercase mb-1">{med.medicineName}</h6>
                  <p className="mb-1 small"><strong>🏥</strong> {med.pharmacy}</p>
                  <p className="mb-2 small"><strong>💊</strong> {capitalizeCategory(med.category)}</p>
                  <a
                    href={med.pharmacyUrl || '#'}
                    className="btn btn-sm btn-outline-success w-100"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ir a la farmacia
                  </a>
                </div>
              ))}
            </div>

            {frequentList.length > 5 && (
              <Button
                variant="light"
                onClick={() => handleScroll('right')}
                className="position-absolute top-50 end-0 translate-middle-y z-2"
              >
                <ChevronRight size={24} />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Footer con ícono */}
      <div className="mt-5 text-muted">
        <Capsule size={40} className="mb-3 text-secondary" />
        <p className="mb-0">
          MediSearch te ayuda a cuidar tu salud, optimizar tus tratamientos y ahorrar en cada compra.
        </p>
      </div>
    </div>
  );
}
