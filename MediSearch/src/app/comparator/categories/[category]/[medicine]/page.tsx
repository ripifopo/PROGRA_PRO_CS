// Archivo: src/app/comparator/categories/[category]/[medicine]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLoading } from '../../../../../context/LoadingContext.tsx';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaHeart, FaBell } from 'react-icons/fa'; // Iconos

// Tipo de dato que representa la estructura de un medicamento
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
  const { category, medicine } = useParams(); // Obtiene parámetros de la URL
  const router = useRouter();
  const { setLoading } = useLoading();

  const [medData, setMedData] = useState<Medicine | null>(null);        // Datos del medicamento
  const [userEmail, setUserEmail] = useState<string | null>(null);      // Correo del usuario
  const [isFrequent, setIsFrequent] = useState<boolean>(false);         // Estado si es frecuente
  const [isAlerted, setIsAlerted] = useState<boolean>(false);           // Estado si ya tiene alerta

  // Carga y valida los datos del medicamento y su estado
  useEffect(() => {
    const fetchAndMatchMedicine = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/medicines');
        if (!res.ok) throw new Error();
        const data = await res.json();

        const decodedCategory = decodeURIComponent(category as string);
        const decodedName = decodeURIComponent(medicine as string);
        let found: Medicine | null = null;

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

        const stored = localStorage.getItem('userProfile');
        if (stored) {
          const parsed = JSON.parse(stored);
          const email = parsed?.email || null;
          setUserEmail(email);

          // Verifica si es frecuente
          const freqRes = await fetch(`/api/frequent?email=${email}`);
          const freqData = await freqRes.json();
          const alreadyExists = freqData.some(
            (item: any) => item.medicineName === found?.name && item.pharmacy === found?.pharmacy
          );
          setIsFrequent(alreadyExists);

          // Verifica si ya tiene alerta
          const alertRes = await fetch(`/api/alerts?email=${email}`);
          const alertData = await alertRes.json();
          const alreadyAlerted = alertData.some(
            (item: any) => item.medicineName === found?.name && item.pharmacy === found?.pharmacy
          );
          setIsAlerted(alreadyAlerted);
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

  // Formatea precios con puntos de miles
  const formatPrice = (price: string) => {
    if (!price || price === '$0') return 'Sin precio disponible';
    const cleanPrice = price.replace(/[^0-9]/g, '');
    return '$' + cleanPrice.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Guarda el medicamento como frecuente
  const handleSaveFrequent = async () => {
    if (!userEmail || !medData) {
      const redirectTo = `/comparator/categories/${encodeURIComponent(category as string)}/${encodeURIComponent(medicine as string)}`;
      router.push(`/auth/continue?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

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
    } catch {
      toast.error('Error al guardar medicamento.');
    }
  };

  // Crea alerta de precio y descuento
  const handleCreateAlert = async () => {
    if (!userEmail || !medData) {
      const redirectTo = `/comparator/categories/${encodeURIComponent(category as string)}/${encodeURIComponent(medicine as string)}`;
      router.push(`/auth/continue?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    const payload = {
      userEmail,
      medicineName: medData.name,
      pharmacy: medData.pharmacy || '',
      category: category as string,
      medicineSlug: encodeURIComponent(medicine as string),
      categorySlug: encodeURIComponent(category as string),
      pharmacyUrl: medData.url || '',         // ← importante para redirigir
      imageUrl: medData.image || '',          // ← necesario para mostrar la imagen
      createdAt: new Date().toISOString()
    };
    
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsAlerted(true);
        toast.success('Alerta creada correctamente.');
      } else {
        toast.error('Ya existe una alerta activa.');
      }
    } catch {
      toast.error('Error al crear la alerta.');
    }
  };

  if (!medData) return null;

  return (
    <Container className="py-5">
      {/* Botón para volver */}
      <Button
        variant="outline-success"
        className="mb-4"
        onClick={() => router.push(`/comparator/categories/${category}`)}
      >
        ← Volver a Medicamentos
      </Button>

      <Row className="align-items-center">
        {/* Imagen del medicamento */}
        <Col md={5} className="text-center">
          <img
            src={medData.image || 'https://via.placeholder.com/300'}
            alt={medData.name}
            className="img-fluid rounded shadow-sm"
            style={{ maxHeight: '300px', objectFit: 'contain' }}
          />
        </Col>

        {/* Info del medicamento */}
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
            {/* Ir a la farmacia */}
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
                textDecoration: 'none'
              }}
            >
              🏪 Ir a la farmacia
            </a>

            {/* Corazón de frecuente */}
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
                cursor: 'pointer'
              }}
            >
              <FaHeart size={20} color={isFrequent ? 'white' : 'black'} />
            </button>

            {/* Campanita para crear alerta */}
            <button
              className="d-flex justify-content-center align-items-center"
              onClick={handleCreateAlert}
              title="Crear alerta"
              style={{
                backgroundColor: isAlerted ? '#ffc107' : 'transparent',
                border: '2px solid black',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer'
              }}
            >
              <FaBell size={18} color={isAlerted ? 'black' : 'black'} />
            </button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
