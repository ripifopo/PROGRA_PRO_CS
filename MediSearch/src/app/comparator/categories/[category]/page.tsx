'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner, Button, Form, Row, Col, Card } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';

// Importa el contexto de carga
import { useLoading } from '../../../../context/LoadingContext.tsx';

// Definición de la estructura del medicamento
interface Medicine {
  name: string;
  price: string;
  image?: string;
  pharmacy: string;
  url?: string;
  category?: string;
  stock?: number;
}

export default function CategoryPage() {
  const { setLoading } = useLoading();
  const { category } = useParams();
  const router = useRouter();

  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pharmacyFilter, setPharmacyFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setInternalLoading] = useState(true);

  // Carga inicial de los medicamentos desde la API
  useEffect(() => {
    const fetchMedicines = async () => {
      setLoading(true);
      setInternalLoading(true);
      try {
        const res = await fetch('/api/medicines');
        const data = await res.json();
        setAllMedicines(data);
      } catch (error) {
        console.error('Error cargando medicamentos:', error);
      } finally {
        setTimeout(() => {
          setLoading(false);
          setInternalLoading(false);
        }, 400);
      }
    };

    fetchMedicines();
  }, []);

  // Filtra los medicamentos cada vez que cambia alguna condición
  useEffect(() => {
    const filtered = allMedicines.filter((m) => {
      if (!m.category) return false;
      return m.category.toLowerCase() === decodeURIComponent(category).toLowerCase();
    });

    setFilteredMedicines(filtered);
  }, [allMedicines, category]);

  // Filtrado dinámico en base a búsqueda, farmacia y ordenamiento
  const visibleMedicines = filteredMedicines
    .filter((med) => {
      const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPharmacy = pharmacyFilter ? med.pharmacy === pharmacyFilter : true;
      const hasValidPrice = med.price && med.price !== "$0";
      return matchesSearch && matchesPharmacy && hasValidPrice;
    })
    .sort((a, b) => {
      const priceA = parseInt(a.price.replace(/\D/g, ''), 10) || 0;
      const priceB = parseInt(b.price.replace(/\D/g, ''), 10) || 0;
      return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
    });

  // Maneja la acción de volver a la página de categorías
  const handleBack = () => {
    router.push('/comparator/categories');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Botón de retorno */}
      <Button variant="outline-success" onClick={handleBack} className="mb-4">
        <FaArrowLeft className="me-2" />
        Volver a Categorías
      </Button>

      {/* Título de la categoría */}
      <h1 className="text-center mb-3 text-success">
        {decodeURIComponent(category)}
      </h1>
      <p className="text-center text-muted mb-5">
        Explora los medicamentos disponibles en esta categoría
      </p>

      {/* Filtros disponibles */}
      <Row className="justify-content-center mb-4 g-2">
        <Col xs={12} md={4}>
          <Form.Control
            type="text"
            placeholder="Buscar medicamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col xs={12} md={3}>
          <Form.Select
            value={pharmacyFilter}
            onChange={(e) => setPharmacyFilter(e.target.value)}
          >
            <option value="">Todas las farmacias</option>
            <option value="Farmacia Ahumada">Farmacia Ahumada</option>
            <option value="Salcobrand">Salcobrand</option>
            <option value="Cruz Verde">Cruz Verde</option>
          </Form.Select>
        </Col>
        <Col xs={12} md={3}>
          <Form.Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="asc">Menor precio</option>
            <option value="desc">Mayor precio</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Lista de medicamentos */}
      {visibleMedicines.length === 0 ? (
        <p className="text-center text-muted mt-5">No se encontraron medicamentos para esta categoría.</p>
      ) : (
        <Row className="g-4">
          {visibleMedicines.map((med, index) => (
            <Col key={index} xs={12} sm={6} md={4} lg={3}>
              <Card className="h-100 shadow-sm text-center border-0">
                <Card.Img
                  variant="top"
                  src={med.image || "https://via.placeholder.com/150"}
                  style={{ height: '160px', objectFit: 'contain' }}
                  className="p-3"
                />
                <Card.Body>
                  <Card.Title className="fs-6 text-success fw-bold">{med.name}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">{med.pharmacy}</Card.Subtitle>
                  <Card.Text className="fs-5 fw-semibold text-dark">{med.price}</Card.Text>
                  <Button
                    variant="outline-success"
                    size="sm"
                    href={med.url}
                    target="_blank"
                  >
                    Ver más
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
