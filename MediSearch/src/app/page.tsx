// Archivo: src/app/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { HeartPulse, Search, GeoAlt, BookmarkHeart, Capsule } from 'react-bootstrap-icons';
import { Button, Spinner, Alert, Card } from 'react-bootstrap';

// Interfaz del medicamento frecuente obtenido desde la API
interface FrequentMedicine {
  userEmail: string;
  medicineName: string;
  pharmacy: string;
  category: string;
  imageUrl?: string;
  savedAt: string;
}

// Función que transforma "dolor fiebre e inflamacion" → "Dolor Fiebre E Inflamacion"
const capitalizeCategory = (text: string) => {
  return decodeURIComponent(text)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function HomePage() {
  const router = useRouter();
  const [frequentList, setFrequentList] = useState<FrequentMedicine[]>([]);
  const [loading, setLoading] = useState(false);

  // Al montar, se consulta al backend si hay usuario y medicamentos frecuentes
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

  return (
    <div className="py-5 text-center container">
      {/* Icono principal */}
      <HeartPulse size={70} className="text-success mb-4" />

      {/* Título */}
      <h1 className="display-3 fw-bold text-success mb-3">Bienvenido a MediSearch</h1>

      {/* Slogan */}
      <p className="lead text-muted mb-5">
        Compara precios, consulta disponibilidad y encuentra tu farmacia más cercana.
      </p>

      {/* Botones de navegación */}
      <div className="d-flex justify-content-center gap-3 flex-wrap">
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

      {/* Recomendaciones frecuentes si existen */}
      {frequentList.length > 0 && (
        <div className="mt-5">
          <p className="text-muted fst-italic mb-4 fs-5">
            Basado en tus búsquedas, podrías necesitar nuevamente...
          </p>

          {frequentList.map((med, index) => (
            <Card key={index} className="shadow p-4 text-center" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <Image
                src={med.imageUrl || 'https://via.placeholder.com/200'}
                alt={med.medicineName}
                width={200}
                height={120}
                className="mx-auto mb-3 rounded"
                style={{ objectFit: 'contain', maxHeight: '150px' }}
              />

              <h5 className="text-success fw-bold mb-3 text-uppercase">{med.medicineName}</h5>

              <p>
                <span className="me-2">🏥</span>
                <strong>Farmacia:</strong> {med.pharmacy}
              </p>

              <p>
                <span className="me-2">💊</span>
                <strong>Categoría:</strong> {capitalizeCategory(med.category)}
              </p>

              <Button
                variant="outline-success"
                className="mt-3 w-100"
                onClick={() => {
                  const categorySlug = encodeURIComponent(med.category.toLowerCase());
                  const medicineSlug = encodeURIComponent(med.medicineName);
                  const redirectTo = `/comparator/categories/${categorySlug}?search=${medicineSlug}`;
                  router.push(redirectTo);
                }}
              >
                Ver disponibilidad
              </Button>
            </Card>
          ))}
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
