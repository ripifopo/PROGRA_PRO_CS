'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Container, Row, Col, Spinner, Alert, Button, Card, Badge } from 'react-bootstrap';
import Link from 'next/link';

interface Medicine {
  id: number;
  name: string;
  offer_price: string;
  normal_price: string;
  discount: number;
  url: string;
  image: string;
  category: string;
  bioequivalent: string;
  pharmacy: string;
}

export default function AlertByIdPage() {
  const { id } = useParams();
  const [alternatives, setAlternatives] = useState<Medicine[]>([]);
  const [originalName, setOriginalName] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cleanText = (text: string) =>
      text
        .toLowerCase()
        .replace(/mg|ml|comprimidos?|cápsulas?|x\s*\d+/gi, '')
        .replace(/[^a-zA-Záéíóúüñ\d\s]/gi, '')
        .trim();

    const fetchEquivalents = async () => {
      try {
        const res = await fetch('/api/medicines');
        const allData = await res.json();

        let foundCategory = '';
        let original: Medicine | null = null;

        for (const pharmacy of allData) {
          for (const [cat, meds] of Object.entries(pharmacy.categories || {})) {
            const match = (meds as any[]).find((m) => m.id === Number(id));
            if (match) {
              original = { ...match, pharmacy: pharmacy.pharmacy };
              foundCategory = cat;
              break;
            }
          }
          if (original) break;
        }

        if (!original) {
          setError('No se encontró el medicamento especificado.');
          return;
        }

        setOriginalName(original.name);
        setOriginalPrice(original.offer_price || original.normal_price || '$0');

        const palabrasClave = cleanText(original.name).split(/\s+/).filter(Boolean);

        const candidatos: Medicine[] = [];
        const vistos = new Set();

        for (const pharmacy of allData) {
          const meds = pharmacy.categories?.[foundCategory] || [];
          meds.forEach((m: any) => {
            const limpio = cleanText(m.name || '');
            const tienePalabraClave = palabrasClave.some(p => limpio.includes(p));
            const tieneImagen = m.image && m.image.trim() !== '';
            const tienePrecio = m.offer_price && m.offer_price.trim() !== '$0';
            const key = `${limpio}_${m.offer_price}_${pharmacy.pharmacy}`;

            if (
              tienePalabraClave &&
              tieneImagen &&
              tienePrecio &&
              m.id !== Number(id) &&
              !vistos.has(key)
            ) {
              vistos.add(key);
              candidatos.push({ ...m, pharmacy: pharmacy.pharmacy });
            }
          });
        }

        const ordenados = candidatos
          .sort((a, b) =>
            parseInt(a.offer_price.replace(/[^\d]/g, '')) -
            parseInt(b.offer_price.replace(/[^\d]/g, ''))
          )
          .slice(0, 3);

        setAlternatives(ordenados);
      } catch (err) {
        setError('No se pudo obtener equivalentes.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEquivalents();
  }, [id]);

  const formatPrice = (price: string) => {
    const clean = price.replace(/[^\d]/g, '');
    return '$' + clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  return (
    <Container className="py-5">
      <div className="text-center mb-4">
        <h2 className="fw-bold text-success">Alternativas Terapéuticas</h2>
        <p className="text-muted">
          Te mostramos medicamentos genéricos o de marca similares a:{' '}
          <strong className="text-dark">{originalName}</strong>
          {originalPrice && (
            <span className="d-block mt-2">
              <small className="text-muted">Precio del medicamento original:</small>{' '}
              <strong className="text-danger">{formatPrice(originalPrice)}</strong>
            </span>
          )}
        </p>
      </div>

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" variant="success" />
          <p className="mt-3">Buscando medicamentos equivalentes...</p>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="text-center">
          ❌ {error}
        </Alert>
      )}

      {!loading && !error && alternatives.length === 0 && (
        <Alert variant="warning" className="text-center">
          ⚠️ No se encontraron medicamentos similares.
        </Alert>
      )}

      {!loading && !error && alternatives.length > 0 && (
        <Row className="g-4">
          {alternatives.map((med, idx) => {
            const imageUrl = med.image?.trim() || 'https://via.placeholder.com/150';
            const offer = med.offer_price || '$0';
            const normal = med.normal_price || '$0';
            const hasDiscount = offer !== normal && normal !== '$0';
            const isBioequivalent = med.bioequivalent === 'true';

            const showBadge = hasDiscount || isBioequivalent;

            return (
              <Col key={idx} xs={12} sm={6} md={4}>
                <Card className="h-100 shadow-sm">
                  <Card.Img
                    variant="top"
                    src={imageUrl}
                    style={{ height: '160px', objectFit: 'contain' }}
                  />
                  <Card.Body className="text-center">
                    <h5 className="fw-bold text-success">{med.name}</h5>
                    <p className="text-muted mb-1">{med.pharmacy}</p>
                    {hasDiscount && (
                      <p className="text-muted text-decoration-line-through">
                        {formatPrice(normal)}
                      </p>
                    )}
                    <p className="fw-bold text-danger fs-5">{formatPrice(offer)}</p>
                    {med.discount > 0 && (
                      <Badge bg="success" className="mb-2 me-1">
                        {med.discount}% dcto.
                      </Badge>
                    )}
                    {showBadge && (
                      <Badge bg="info" className="mb-2">
                        ✅ ¡Buena opción!
                      </Badge>
                    )}
                    <Link
                      href={`/comparator/categories/${encodeURIComponent(med.category)}/${encodeURIComponent(med.id || '0')}`}
                      className="btn btn-outline-primary btn-sm w-100 mt-2"
                    >
                      Ver detalles
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <div className="text-center mt-5">
        <Button href="/alerts" variant="outline-success" className="px-4 py-2 fw-bold">
          ← Volver a Mis Alertas
        </Button>
      </div>
    </Container>
  );
}
