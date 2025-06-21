// Archivo: src/app/comparator/categories/[category]/[medicine]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLoading } from '../../../../../context/LoadingContext';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaHeart, FaBell, FaMapMarkerAlt } from 'react-icons/fa';
import StockLocationModal from '@/app/components/StockLocationModal';

interface Medicine {
  id: number;
  name: string;
  offer_price: string;
  normal_price: string;
  image: string;
  url: string;
  stock: string | null;
  pharmacy?: string;
}

export default function MedicineDetailPage() {
  const { category, medicine } = useParams();
  const router = useRouter();
  const { setLoading } = useLoading();

  const [medData, setMedData] = useState<Medicine | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isFrequent, setIsFrequent] = useState<boolean>(false);
  const [isAlerted, setIsAlerted] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchAndMatchMedicine = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/medicines');
        if (!res.ok) throw new Error();
        const data = await res.json();

        const decodedId = parseInt(decodeURIComponent(medicine as string));
        let found: Medicine | null = null;

        for (const pharmacy of data) {
          for (const categoryList of Object.values(pharmacy.categories || {})) {
            for (const med of categoryList as any[]) {
              if (Number(med.id) === decodedId) {
                const rawStock = med.stock ?? med.available ?? med.in_stock ?? null;
                const normalizedStock =
                  rawStock === true || rawStock === 'yes' || rawStock === 'available'
                    ? 'yes'
                    : rawStock === false || rawStock === 'no' || rawStock === 'unavailable'
                    ? 'no'
                    : null;

                found = { ...med, pharmacy: pharmacy.pharmacy, stock: normalizedStock };
                break;
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

          const freqRes = await fetch(`/api/frequent?email=${email}`);
          const freqData = await freqRes.json();
          setIsFrequent(freqData.some((item: any) => item.medicineId === found?.id && item.pharmacy === found?.pharmacy));

          const alertRes = await fetch(`/api/alerts?email=${email}`);
          const alertData = await alertRes.json();
          setIsAlerted(alertData.some((item: any) => item.medicineId === found?.id && item.pharmacy === found?.pharmacy));
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

  const formatPrice = (price: string) => {
    if (!price || price === '$0') return 'Sin precio disponible';
    const clean = price.replace(/[^0-9]/g, '');
    return '$' + clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const calculateDiscount = () => {
    if (!medData) return null;
    const offer = parseInt(medData.offer_price.replace(/\D/g, ''));
    const normal = parseInt(medData.normal_price.replace(/\D/g, ''));
    if (!normal || normal === 0 || offer >= normal) return null;
    return Math.round(100 - (offer / normal) * 100);
  };

  const handleSaveFrequent = async () => {
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
      <Button variant="outline-success" className="mb-4" onClick={() => router.push(`/comparator/categories/${category}`)}>
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
          <h2 className="text-success fw-bold mb-3">{medData.name?.toUpperCase() || 'Sin nombre'}</h2>

          {medData.offer_price !== medData.normal_price && medData.normal_price !== '$0' ? (
            <>
              <h5 className="text-muted text-decoration-line-through">{formatPrice(medData.normal_price)}</h5>
              <h4 className="text-danger fw-bold">{formatPrice(medData.offer_price)}</h4>
              {discount && <span className="badge bg-success">{discount}% de descuento</span>}
            </>
          ) : (
            <h4 className="text-dark fw-bold">{formatPrice(medData.offer_price)}</h4>
          )}

          <p className="mb-2">
            <strong>Stock:</strong>{' '}
            <span style={{ color: medData.stock === 'yes' ? 'green' : 'red' }}>
              ⬤ {medData.stock === 'yes' ? 'Disponible' : 'Sin stock'}
            </span>
          </p>

          <p><strong>Farmacia:</strong> {medData.pharmacy}</p>

          <div className="d-flex align-items-center gap-3 mt-3 flex-wrap">
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

            <Button variant="outline-success" onClick={() => setShowModal(true)}>
              Ver stock en tu comuna
            </Button>

            <Button variant="outline-primary" onClick={() => router.push(`/availability?redirect=${encodeURIComponent(`/comparator/categories/${category}/${medicine}`)}`)}>
              <FaMapMarkerAlt className="me-2" /> Farmacias cercanas
            </Button>
          </div>
        </Col>
      </Row>

      <StockLocationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSelect={(region, commune) => {
          toast.info(`Región: ${region}, Comuna: ${commune}`);
        }}
        pharmacy={medData.pharmacy || ''}
      />

      <div className="text-center mt-5">
        <Button
          aria-label={`Ver precios históricos de ${medData.name} en ${medData.pharmacy}`}
          onClick={() => {
            const url = `/price-history?medicineId=${medData.id}` +
                        `&pharmacy=${encodeURIComponent(medData.pharmacy || '')}` +
                        `&name=${encodeURIComponent(medData.name || '')}` +
                        `&category=${encodeURIComponent(category as string)}` +
                        `&fromMedicine=true`;
            router.push(url);
          }}
          style={{
            backgroundColor: '#004080',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease-in-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0059b3')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#004080')}
        >
          📈 Ver precios históricos
        </Button>
      </div>
    </Container>
  );
}
