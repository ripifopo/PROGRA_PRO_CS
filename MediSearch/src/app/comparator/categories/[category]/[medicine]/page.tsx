'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLoading } from '../../../../../context/LoadingContext.tsx';
import { Accordion, Button, Card, Container, Row, Col, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Link from 'next/link';

// Interfaz que define la estructura esperada de un objeto medicamento
interface Medicine {
  name: string;
  price: string;
  image: string;
  url: string;
  form: string;
  stock: number;
  description: string;
  pharmacy?: string;
}

// Componente principal de detalle de un medicamento
export default function MedicineDetailPage() {
  const { category, medicine } = useParams(); // Se extraen los parámetros dinámicos desde la URL
  const router = useRouter();
  const { setLoading } = useLoading();

  // Estados para almacenar los datos del medicamento y las sugerencias relacionadas
  const [medData, setMedData] = useState<Medicine | null>(null);
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);

  // Efecto para obtener los datos del medicamento actual y sugerencias desde la API
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
        const alternatives: Medicine[] = [];

        // Se recorren las farmacias y sus categorías para encontrar el medicamento actual y sugerencias
        for (const pharmacy of data) {
          const categories = pharmacy.categories || {};
          for (const [catName, meds] of Object.entries(categories)) {
            if (catName.toLowerCase() === decodedCategory.toLowerCase()) {
              for (const med of meds as any[]) {
                if (med.name === decodedName) {
                  found = { ...med, pharmacy: pharmacy.pharmacy };
                } else {
                  alternatives.push({ ...med, pharmacy: pharmacy.pharmacy });
                }
              }
            }
          }
        }

        if (!found) throw new Error();
        setMedData(found);
        setSuggestions(alternatives.slice(0, 3)); // Se seleccionan hasta 3 sugerencias
      } catch {
        toast.error('Medicamento no encontrado.');
        router.push(`/comparator/categories/${category}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAndMatchMedicine();
  }, [medicine, category, router, setLoading]);

  // Formateador de precios con separador de miles
  const formatPrice = (price: string) => {
    if (!price || price === '$0') return 'Sin precio disponible';
    const cleanPrice = price.replace(/[^0-9]/g, '');
    return '$' + cleanPrice.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Identifica si la farmacia actual es Salcobrand
  const isSalcobrand = medData?.pharmacy?.toLowerCase().includes('salcobrand');

  // Formateador de la descripción que aplica estilo especial para Salcobrand
  const formatDescription = (description: string) => {
    if (!description) return null;
    if (!isSalcobrand) return <p>{description}</p>;

    const lines = description.split('.').map(l => l.trim()).filter(Boolean);
    return (
      <>
        {lines.map((line, index) => {
          const boldMatch = line.match(/^(.+?):\s*(.*)$/);
          return (
            <p key={index}>
              {boldMatch ? (
                <>
                  <strong>{boldMatch[1]}:</strong> {boldMatch[2]}
                </>
              ) : (
                line
              )}
            </p>
          );
        })}
      </>
    );
  };

  // Si no se ha encontrado el medicamento, no se renderiza nada
  if (!medData) return null;

  return (
    <Container className="py-5">
      {/* Botón para volver a la lista de medicamentos */}
      <Button
        variant="outline-success"
        className="mb-4"
        onClick={() => router.push(`/comparator/categories/${category}`)}
      >
        ← Volver a Medicamentos
      </Button>

      {/* Información del medicamento */}
      <Row className="align-items-center mb-4">
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
          <h4 className="text-dark">
            {formatPrice(medData.price)}{' '}
            <Badge bg={medData.stock > 0 ? 'success' : 'secondary'}>
              {medData.stock > 0 ? 'Stock disponible' : 'Sin stock'}
            </Badge>
          </h4>
          <p><strong>Forma:</strong> {medData.form}</p>
          <p><strong>Farmacia:</strong> {medData.pharmacy}</p>
          <a
            href={medData.url}
            className="btn btn-success mt-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ir al sitio web de la farmacia
          </a>
        </Col>
      </Row>

      {/* Acordeón para la descripción detallada */}
      <Accordion defaultActiveKey="0">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Descripción detallada</Accordion.Header>
          <Accordion.Body>{formatDescription(medData.description)}</Accordion.Body>
        </Accordion.Item>
      </Accordion>

      {/* Sección de sugerencias */}
      {suggestions.length > 0 && (
        <div className="mt-5">
          <h5 className="fw-bold mb-3">¿Por qué no probar también?</h5>
          <Row>
            {suggestions.map((sug, idx) => (
              <Col key={idx} md={4} className="mb-4">
                <Link
                  href={`/comparator/categories/${encodeURIComponent(category as string)}/${encodeURIComponent(sug.name)}`}
                  className="text-decoration-none"
                >
                  <Card className="h-100 shadow-sm border-0 text-center p-3 hover-shadow">
                    <Card.Img
                      src={sug.image || 'https://via.placeholder.com/100'}
                      alt={sug.name}
                      style={{ height: '120px', objectFit: 'contain' }}
                    />
                    <Card.Body>
                      <Card.Title className="text-success fs-6 fw-bold">
                        {sug.name.toUpperCase()}
                      </Card.Title>
                      <Card.Text className="text-dark fw-semibold">{formatPrice(sug.price)}</Card.Text>
                      <Card.Text className="text-muted small">{sug.pharmacy}</Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Estilo adicional para resaltar tarjetas sugeridas */}
      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 8px 20px rgba(0, 128, 0, 0.3);
          transition: all 0.3s ease;
        }
      `}</style>
    </Container>
  );
}
