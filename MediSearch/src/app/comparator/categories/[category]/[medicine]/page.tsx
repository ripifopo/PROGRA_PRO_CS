// src/app/comparator/categories/[category]/[medicine]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLoading } from '../../../../../context/LoadingContext.tsx';
import { Button, Container, Row, Col, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaHeart } from 'react-icons/fa';

// Interfaz que representa un medicamento
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
  const { category, medicine } = useParams();
  const router = useRouter();
  const { setLoading } = useLoading();

  const [medData, setMedData] = useState<Medicine | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Buscar medicamento por nombre y categoría desde la API
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
          setUserEmail(parsed?.email || null);
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

  // Formatear el precio con separadores
  const formatPrice = (price: string) => {
    if (!price || price === '$0') return 'Sin precio disponible';
    const cleanPrice = price.replace(/[^0-9]/g, '');
    return '$' + cleanPrice.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Función que guarda el medicamento como frecuente (si hay sesión iniciada)
  const handleSaveFrequent = async () => {
    if (!userEmail || !medData) {
      const encodedCategory = encodeURIComponent(category as string);
      const encodedMedicine = encodeURIComponent(medicine as string);
      const redirectTo = `/comparator/categories/${encodedCategory}/${encodedMedicine}`;
      router.push(`/auth/continue?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    const payload = {
      userEmail,
      medicineName: medData.name,
      pharmacy: medData.pharmacy || '',
      category: category as string,
      savedAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/frequent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) toast.success('Guardado como frecuente.');
      else toast.error('No se pudo guardar.');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar.');
    }
  };

  if (!medData) return null;

  return (
    <Container className="py-5">
      <Button
        variant="outline-success"
        className="mb-4"
        onClick={() => router.push(`/comparator/categories/${category}`)}
      >
        ← Volver a Medicamentos
      </Button>

      <Row className="align-items-center">
        <Col md={5} className="text-center">
          <img
            src={medData.image || 'https://via.placeholder.com/300'}
            alt={medData.name}
            className="img-fluid rounded shadow-sm"
            style={{ maxHeight: '300px', objectFit: 'contain' }}
          />
        </Col>

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

          <div className="d-flex gap-2 mt-3">
            <a
              href={medData.url}
              className="btn btn-success"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ir a farmacia
            </a>
            <Button
              variant="outline-danger"
              onClick={handleSaveFrequent}
              title="Guardar como frecuente"
            >
              <FaHeart />
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
