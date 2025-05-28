// Archivo: src/app/comparator/categories/[category]/[medicine]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLoading } from '../../../../../context/LoadingContext.tsx';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaHeart } from 'react-icons/fa';

// Interfaz del medicamento (estructura recibida desde la API de medicamentos)
interface Medicine {
  name: string;
  price: string;
  image: string;
  url: string;
  form: string;
  stock: number;
  pharmacy?: string;
}

export default function MedicineDetailPage() {
  const { category, medicine } = useParams(); // Obtiene los parámetros de la URL
  const router = useRouter();
  const { setLoading } = useLoading();

  const [medData, setMedData] = useState<Medicine | null>(null);         // Datos del medicamento actual
  const [userEmail, setUserEmail] = useState<string | null>(null);       // Email del usuario autenticado
  const [isFrequent, setIsFrequent] = useState<boolean>(false);          // Si ya fue guardado como frecuente

  // Efecto que busca los datos del medicamento y revisa si ya fue guardado como frecuente
  useEffect(() => {
    const fetchAndMatchMedicine = async () => {
      try {
        setLoading(true);

        // Carga la lista completa de medicamentos desde la API
        const res = await fetch('/api/medicines');
        if (!res.ok) throw new Error();
        const data = await res.json();

        // Decodifica los parámetros desde la URL
        const decodedCategory = decodeURIComponent(category as string);
        const decodedName = decodeURIComponent(medicine as string);

        let found: Medicine | null = null;

        // Recorre la estructura de farmacias -> categorías -> medicamentos
        for (const pharmacy of data) {
          const categories = pharmacy.categories || {};
          for (const [catName, meds] of Object.entries(categories)) {
            if (catName.toLowerCase() === decodedCategory.toLowerCase()) {
              for (const med of meds as any[]) {
                if (med.name === decodedName) {
                  found = { ...med, pharmacy: pharmacy.pharmacy };
                  break;
                }
              }
            }
            if (found) break;
          }
          if (found) break;
        }

        if (!found) throw new Error();
        setMedData(found);

        // Extrae el email del usuario autenticado
        const stored = localStorage.getItem('userProfile');
        if (stored) {
          const parsed = JSON.parse(stored);
          const email = parsed?.email || null;
          setUserEmail(email);

          // Verifica si el medicamento ya está guardado como frecuente
          const freqRes = await fetch(`/api/frequent?email=${email}`);
          const freqData = await freqRes.json();
          const alreadyExists = freqData.some(
            (item: any) => item.medicineName === found?.name && item.pharmacy === found?.pharmacy
          );
          setIsFrequent(alreadyExists);
        }

      } catch {
        toast.error('Medicamento no encontrado.');
        router.push(`/comparator/categories/${category}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAndMatchMedicine();
  }, [medicine, category, router, setLoading]);

  // Formatea el precio agregando puntos como separadores de miles
  const formatPrice = (price: string) => {
    if (!price || price === '$0') return 'Sin precio disponible';
    const cleanPrice = price.replace(/[^0-9]/g, '');
    return '$' + cleanPrice.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Función para guardar el medicamento como frecuente
  const handleSaveFrequent = async () => {
    if (!userEmail || !medData) {
      // Si no hay sesión iniciada, redirige a la página de autenticación intermedia
      const redirectTo = `/comparator/categories/${encodeURIComponent(category as string)}/${encodeURIComponent(medicine as string)}`;
      router.push(`/auth/continue?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    // Construye el objeto que se enviará al backend
    const payload = {
      userEmail,
      medicineName: medData.name,
      pharmacy: medData.pharmacy || '',
      category: category as string,
      imageUrl: medData.image || '',
      medicineSlug: encodeURIComponent(medicine as string),
      categorySlug: encodeURIComponent(category as string),
      pharmacyUrl: medData.url || '',
      savedAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/frequent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsFrequent(true);
        toast.success('Guardado como frecuente.');
      } else {
        toast.error('Ya es tu medicamento frecuente.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar medicamento.');
    }
  };

  if (!medData) return null;

  return (
    <Container className="py-5">
      {/* Botón para volver a la categoría anterior */}
      <Button
        variant="outline-success"
        className="mb-4"
        onClick={() => router.push(`/comparator/categories/${category}`)}
      >
        ← Volver a Medicamentos
      </Button>

      <Row className="align-items-center">
        {/* Columna izquierda: Imagen del medicamento */}
        <Col md={5} className="text-center">
          <img
            src={medData.image || 'https://via.placeholder.com/300'}
            alt={medData.name}
            className="img-fluid rounded shadow-sm"
            style={{ maxHeight: '300px', objectFit: 'contain' }}
          />
        </Col>

        {/* Columna derecha: Información detallada */}
        <Col md={7}>
          <h2 className="text-success fw-bold mb-3">{medData.name.toUpperCase()}</h2>
          <h4 className="text-dark mb-2">{formatPrice(medData.price)}</h4>

          <p className="mb-2">
            <strong>Stock:</strong>{' '}
            <span style={{ color: medData.stock > 0 ? 'green' : 'red' }}>
              ⬤ {medData.stock > 0 ? 'Disponible' : 'Sin stock'}
            </span>
          </p>
          <p><strong>Farmacia:</strong> {medData.pharmacy}</p>

          {/* Botones de acción */}
          <div className="d-flex align-items-center gap-3 mt-3">
            {/* Botón moderno para ir a la página oficial del producto */}
            <a
              href={medData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn d-flex align-items-center gap-2 px-4 py-2"
              style={{
                background: 'linear-gradient(90deg, #2E8B57, #3CB371)',
                color: 'white',
                fontWeight: 500,
                borderRadius: '50px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s ease-in-out',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
            >
              🏪 Ir a la farmacia
            </a>

            {/* Botón con ícono de corazón, relleno si es frecuente */}
            <button
              className="d-flex justify-content-center align-items-center"
              onClick={handleSaveFrequent}
              title="Guardar como frecuente"
              style={{
                backgroundColor: isFrequent ? '#dc3545' : 'transparent',
                border: '2px solid black',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
            >
              <FaHeart
                size={20}
                color={isFrequent ? 'white' : 'black'}
                style={{ transition: 'color 0.3s ease' }}
              />
            </button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
