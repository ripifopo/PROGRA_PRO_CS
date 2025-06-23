'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLoading } from '../../../../../context/LoadingContext';
import { Button, Container, Row, Col, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaHeart, FaBell, FaMapMarkerAlt } from 'react-icons/fa';
import dynamic from 'next/dynamic';

const StockLocationModal = dynamic(() => import('@/app/components/StockLocationModal'), { ssr: false });

function deepDecode(text: string): string {
  let decoded = text;
  let prev;
  try {
    do {
      prev = decoded;
      decoded = decodeURIComponent(prev);
    } while (decoded !== prev);
  } catch {
    return decoded;
  }
  return decoded;
}

interface Medicine {
  id: number;
  name: string;
  offer_price: string;
  normal_price: string;
  image: string;
  url: string;
  stock: string | null;
  pharmacy?: string;
  bioequivalent?: string;
}

export default function MedicineDetailPage() {
  const { category: rawCategory, medicine } = useParams();
  const category = deepDecode(rawCategory as string);
  const router = useRouter();
  const { setLoading } = useLoading();

  const [medData, setMedData] = useState<Medicine | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isFrequent, setIsFrequent] = useState<boolean>(false);
  const [isAlerted, setIsAlerted] = useState<boolean>(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [region, setRegion] = useState('');
  const [commune, setCommune] = useState('');

  const updateLocationFromStorage = () => {
  const savedRegion = localStorage.getItem('selectedRegion') || '';
  const savedCommune = localStorage.getItem('selectedCommune') || '';
  setRegion(savedRegion);
  setCommune(savedCommune);
  setLocationSelected(!!(savedRegion && savedCommune));
};

  useEffect(() => {
    const savedRegion = localStorage.getItem('selectedRegion');
    const savedCommune = localStorage.getItem('selectedCommune');
    if (!savedRegion || !savedCommune) {
      setLocationSelected(false);
    } else {
      setRegion(savedRegion);
      setCommune(savedCommune);
      setLocationSelected(true);
    }
  }, []);

  useEffect(() => {
    if (!locationSelected) return;

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

                found = {
                  ...med,
                  pharmacy: pharmacy.pharmacy,
                  stock: normalizedStock,
                  bioequivalent: String(med.bioequivalent ?? 'false'),
                };
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
        router.push(`/comparator/categories/${rawCategory}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAndMatchMedicine();
  }, [medicine, rawCategory, router, setLoading, locationSelected]);

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
      const currentPath = `/comparator/categories/${rawCategory}/${medicine}`;
      router.push(`/auth/continue?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    const payload = {
      userEmail,
      medicineId: medData.id,
      medicineName: medData.name,
      pharmacy: medData.pharmacy || '',
      category,
      imageUrl: medData.image || '',
      medicineSlug: encodeURIComponent(medicine as string),
      categorySlug: encodeURIComponent(rawCategory as string),
      pharmacyUrl: medData.url || '',
      savedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/frequent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Guardado como frecuente.');
        setIsFrequent(true);
      } else {
        toast.error('Ya es tu medicamento frecuente.');
      }
    } catch {
      toast.error('Error al guardar medicamento.');
    }
  };

  const handleCreateAlert = async () => {
    if (!userEmail || !medData) {
      const currentPath = `/comparator/categories/${rawCategory}/${medicine}`;
      router.push(`/auth/continue?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    const cleanPrice = (price: string | undefined) =>
      parseInt(price?.replace(/[^0-9]/g, '') || '999999');

    const payload = {
      userEmail,
      medicineId: medData.id,
      medicineName: medData.name,
      pharmacy: medData.pharmacy || '',
      category,
      medicineSlug: encodeURIComponent(medicine as string),
      categorySlug: encodeURIComponent(rawCategory as string),
      pharmacyUrl: medData.url || '',
      imageUrl: medData.image || '',
      createdAt: new Date().toISOString(),
      bioequivalent: medData.bioequivalent || 'false',
      lastKnownPrice: cleanPrice(medData.offer_price || medData.normal_price),
      triggered: false,
    };

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Alerta creada correctamente.');
        setIsAlerted(true);
      } else {
        toast.error('Ya existe una alerta activa.');
      }
    } catch {
      toast.error('Error al crear la alerta.');
    }
  };

  const discount = calculateDiscount();
  const decodedCategorySlug = deepDecode(rawCategory as string);

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '3rem 0', position: 'relative' }}>

      {!locationSelected && (
        <StockLocationModal
          show={true}
          onClose={() => {
            const region = localStorage.getItem('selectedRegion');
            const commune = localStorage.getItem('selectedCommune');
            if (region && commune) {
              setLocationSelected(true);
            } else {
              toast.error('Por favor selecciona una región y comuna.');
            }
          }}
          pharmacy={medData?.pharmacy || ''}
          productUrl={medData?.url || ''}
         onSelect={(region, commune) => {
          localStorage.setItem('selectedRegion', region);
          localStorage.setItem('selectedCommune', commune);
          toast.success(`📍 Región: ${region}, Comuna: ${commune}`);
          updateLocationFromStorage(); // <- Esto refresca el estado visual
        }}
        />
      )}

      <Container>
      {locationSelected && commune && (
        <div className="text-center mb-4">
          <p className="text-muted d-inline-flex align-items-center gap-2" style={{ fontSize: '1rem' }}>
            <FaMapMarkerAlt color="red" />
            Estás en la comuna <strong>{commune}</strong>
          </p>
        </div>
      )}

      <div className="d-flex justify-content-start mb-3">
        <Button
          variant="outline-dark"
          onClick={() => router.push(`/comparator/categories/${encodeURIComponent(decodedCategorySlug)}`)}
          style={{ borderRadius: '10px', padding: '8px 16px', fontWeight: '500' }}
        >
          ⬅️ Devolver a categoría
        </Button>
      </div>

        {!medData ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <h5>Cargando información del medicamento...</h5>
            </div>
          </div>
        ) : (
          <Card className="shadow-lg border-0 p-4">
            <Row>
              <Col md={5} className="text-center">
                <img
                  src={medData.image || 'https://via.placeholder.com/300'}
                  alt={medData.name}
                  className="img-fluid rounded"
                  style={{ maxHeight: '320px', objectFit: 'contain' }}
                />
              </Col>
              <Col md={7} className="pt-2">
                <h2 className="text-success fw-bold mb-2">{medData.name?.toUpperCase()}</h2>
                {discount && <span className="badge bg-success mb-2">{discount}% de descuento</span>}
                <h5 className="text-muted text-decoration-line-through">{formatPrice(medData.normal_price)}</h5>
                <h3 className="text-danger fw-bold">{formatPrice(medData.offer_price)}</h3>
                <p className="mt-3 mb-2">
                  <strong>Stock:</strong>{' '}
                  <span style={{ color: medData.stock === 'yes' ? 'green' : 'red' }}>
                    ⬤ {medData.stock === 'yes' ? 'Disponible' : 'Sin stock'}
                  </span>
                </p>
                <p><strong>Farmacia:</strong> {medData.pharmacy}</p>

                <div className="d-flex flex-wrap gap-3 mt-4">
                  <a href={medData.url} target="_blank" rel="noopener noreferrer" className="btn btn-success">
                    🏪 Ir a la farmacia
                  </a>
                  <Button variant="primary" onClick={() => router.push(`/availability?redirect=${encodeURIComponent(`/comparator/categories/${category}/${medicine}`)}`)}>
                    <FaMapMarkerAlt className="me-2" /> Farmacias cercanas
                  </Button>
                  <Button variant="outline-success" onClick={() => setLocationSelected(false)}>
                    🕘️ Cambiar comuna
                  </Button>
                </div>

                <div className="d-flex gap-4 mt-4">
                  <button onClick={handleSaveFrequent} className="btn btn-light border rounded-circle p-3">
                    <FaHeart size={24} color={isFrequent ? 'red' : 'black'} />
                  </button>
                  <button onClick={handleCreateAlert} className="btn btn-light border rounded-circle p-3">
                    <FaBell size={22} color={isAlerted ? '#ffc107' : 'black'} />
                  </button>
                </div>

                <div className="text-center mt-4">
                  <Button
                    onClick={() => {
                      const url = `/price-history?medicineId=${medData.id}` +
                        `&pharmacy=${encodeURIComponent(medData.pharmacy || '')}` +
                        `&name=${encodeURIComponent(medData.name || '')}` +
                        `&category=${encodeURIComponent(category)}` +
                        `&fromMedicine=true`;
                      router.push(url);
                    }}
                    style={{ backgroundColor: '#004080', borderRadius: '12px', padding: '12px 24px', fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}
                  >
                    📈 Ver precios históricos
                  </Button>
                </div>

                <p className="text-muted mt-4 text-center" style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                  🔑 Recuerda que los precios y stock pueden variar según la comuna. ¡Revisa siempre antes de comprar!
                </p>
              </Col>
            </Row>
          </Card>
        )}
      </Container>
    </div>
  );
}
