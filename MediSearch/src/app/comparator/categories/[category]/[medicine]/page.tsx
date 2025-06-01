'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLoading } from '../../../../../context/LoadingContext.tsx';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaHeart, FaBell } from 'react-icons/fa';

// Interfaz para tipar los datos del medicamento
interface Medicine {
  id: number;
  name: string;
  offer_price: string;
  normal_price: string;
  image: string;
  url: string;
  stock: string;
  pharmacy?: string;
}

export default function MedicineDetailPage() {
  // Obtiene parámetros de la URL y herramientas de navegación
  const { category, medicine } = useParams();
  const router = useRouter();
  const { setLoading } = useLoading();

  // Estados locales del componente
  const [medData, setMedData] = useState<Medicine | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isFrequent, setIsFrequent] = useState<boolean>(false);
  const [isAlerted, setIsAlerted] = useState<boolean>(false);

  // Efecto al montar el componente
  useEffect(() => {
    const fetchAndMatchMedicine = async () => {
      try {
        setLoading(true);

        // Llama a la API con todos los medicamentos agrupados por farmacia
        const res = await fetch('/api/medicines');
        if (!res.ok) throw new Error();
        const data = await res.json();

        // Decodifica el ID del medicamento desde la URL
        const decodedId = parseInt(decodeURIComponent(medicine as string));
        let found: Medicine | null = null;

        // Busca el medicamento en las categorías anidadas de cada farmacia
        for (const pharmacy of data) {
          for (const category of Object.values(pharmacy.categories || {})) {
            for (const med of category as any[]) {
              if (med.id === decodedId) {
                found = { ...med, pharmacy: pharmacy.pharmacy };
                break;
              }
            }
            if (found) break;
          }
          if (found) break;
        }

        if (!found) throw new Error();
        setMedData(found);

        // Recupera el perfil del usuario desde localStorage
        const stored = localStorage.getItem('userProfile');
        if (stored) {
          const parsed = JSON.parse(stored);
          const email = parsed?.email || null;
          setUserEmail(email);

          // Consulta si el medicamento ya es frecuente
          const freqRes = await fetch(`/api/frequent?email=${email}`);
          const freqData = await freqRes.json();
          setIsFrequent(freqData.some((item: any) =>
            item.medicineId === found?.id && item.pharmacy === found?.pharmacy
          ));

          // Consulta si ya existe una alerta creada
          const alertRes = await fetch(`/api/alerts?email=${email}`);
          const alertData = await alertRes.json();
          setIsAlerted(alertData.some((item: any) =>
            item.medicineId === found?.id && item.pharmacy === found?.pharmacy
          ));
        }
      } catch {
        // En caso de error, redirige a la categoría
        toast.error('Medicamento no encontrado.');
        router.push(`/comparator/categories/${category}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAndMatchMedicine();
  }, [medicine, category, router, setLoading]);

  // Formatea los precios (con puntos y símbolo $)
  const formatPrice = (price: string) => {
    if (!price || price === '$0') return 'Sin precio disponible';
    const clean = price.replace(/[^0-9]/g, '');
    return '$' + clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Calcula el porcentaje de descuento si corresponde
  const calculateDiscount = () => {
    if (!medData) return null;
    const offer = parseInt(medData.offer_price.replace(/\D/g, ''));
    const normal = parseInt(medData.normal_price.replace(/\D/g, ''));
    if (!normal || normal === 0 || offer >= normal) return null;
    const discount = Math.round(100 - (offer / normal) * 100);
    return discount;
  };

  // Guarda el medicamento como frecuente
  const handleSaveFrequent = async () => {
    if (!userEmail || !medData) {
      // Redirige a página de autenticación si no hay sesión iniciada
      const currentPath = `/comparator/categories/${category}/${medicine}`;
      router.push(`/auth/continue?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    const payload = {
      userEmail,
      medicineId: medData.id,
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

  // Crea una alerta para el medicamento
  const handleCreateAlert = async () => {
    if (!userEmail || !medData) {
      const currentPath = `/comparator/categories/${category}/${medicine}`;
      router.push(`/auth/continue?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    const payload = {
      userEmail,
      medicineId: medData.id,
      medicineName: medData.name,
      pharmacy: medData.pharmacy || '',
      category: category as string,
      medicineSlug: encodeURIComponent(medicine as string),
      categorySlug: encodeURIComponent(category as string),
      pharmacyUrl: medData.url || '',
      imageUrl: medData.image || '',
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

  const discount = calculateDiscount();

  return (
    <Container className="py-5">
      {/* Botón de retorno */}
      <Button variant="outline-success" className="mb-4" onClick={() => router.push(`/comparator/categories/${category}`)}>
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

        {/* Información y botones */}
        <Col md={7}>
          <h2 className="text-success fw-bold mb-3">{medData.name?.toUpperCase() || 'Sin nombre'}</h2>

          {/* Precios y descuento */}
          {medData.offer_price !== medData.normal_price && medData.normal_price !== '$0' ? (
            <>
              <h5 className="text-muted text-decoration-line-through">{formatPrice(medData.normal_price)}</h5>
              <h4 className="text-danger fw-bold">{formatPrice(medData.offer_price)}</h4>
              {discount && <span className="badge bg-success">{discount}% de descuento</span>}
            </>
          ) : (
            <h4 className="text-dark fw-bold">{formatPrice(medData.offer_price)}</h4>
          )}

          {/* Stock y farmacia */}
          <p className="mb-2">
            <strong>Stock:</strong>{' '}
            <span style={{ color: medData.stock === 'yes' ? 'green' : 'red' }}>
              ⬤ {medData.stock === 'yes' ? 'Disponible' : 'Sin stock'}
            </span>
          </p>
          <p><strong>Farmacia:</strong> {medData.pharmacy}</p>

          {/* Botones de acción */}
          <div className="d-flex align-items-center gap-3 mt-3">
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

            {/* Botón de frecuente */}
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

            {/* Botón de alerta */}
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
              <FaBell size={18} color="black" />
            </button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
