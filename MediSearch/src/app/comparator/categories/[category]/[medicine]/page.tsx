// Archivo: src/app/comparator/categories/[category]/[medicine]/page.tsx
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
  const [showModal, setShowModal] = useState(true);
  const [locationSelected, setLocationSelected] = useState(false);

  useEffect(() => {
    const storedRegion = localStorage.getItem('selectedRegion');
    const storedCommune = localStorage.getItem('selectedCommune');
    if (storedRegion && storedCommune) {
      setLocationSelected(true);
    } else {
      setShowModal(true);
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

  if (!locationSelected) {
    return (
      <StockLocationModal
        show={showModal}
        onClose={() => {}}
        pharmacy=""
        productUrl=""
        onSelect={(region, commune) => {
          localStorage.setItem('selectedRegion', region);
          localStorage.setItem('selectedCommune', commune);
          toast.success(`📍 Región seleccionada: ${region} / Comuna seleccionada: ${commune}`);
          setLocationSelected(true);
          setShowModal(false);
        }}
      />
    );
  }

  if (!medData) return null;
  const discount = calculateDiscount();

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '3rem 0' }}>
      <Container>
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
                <Button variant="outline-success" onClick={() => setShowModal(true)}>
                  🗺️ Cambiar comuna
                </Button>
              </div>

              <div className="d-flex gap-4 mt-4">
                <button onClick={() => toast('❤️ Guardado')} className="btn btn-light border rounded-circle p-3">
                  <FaHeart size={24} color={isFrequent ? 'red' : 'black'} />
                </button>
                <button onClick={() => toast('🔔 Alerta activa')} className="btn btn-light border rounded-circle p-3">
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
                💡 Recuerda que los precios y stock pueden variar según la comuna. ¡Revisa siempre antes de comprar!
              </p>
            </Col>
          </Row>
        </Card>
      </Container>
    </div>
  );
}
