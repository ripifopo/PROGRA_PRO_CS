// Archivo: src/app/comparator/categories/[category]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Container, Row, Col, Form } from 'react-bootstrap';

// Componente principal de la página de categoría
export default function CategoryPage({ params }: { params: { category: string } }) {
  const router = useRouter();

  // Estados para almacenar medicamentos, búsqueda, filtros, orden y paginación
  const [medicines, setMedicines] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [pharmacyFilter, setPharmacyFilter] = useState('');
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Constantes para paginación
  const medicinesPerPage = 12;
  const indexOfLastMedicine = currentPage * medicinesPerPage;
  const indexOfFirstMedicine = indexOfLastMedicine - medicinesPerPage;

  // Manejo del parámetro categoría
  const [category, setCategory] = useState('');

  useEffect(() => {
    async function unwrapParams() {
      const { category } = await params;
      setCategory(decodeURIComponent(category));
    }
    unwrapParams();
  }, [params]);

  // Cargar medicamentos desde la API
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await fetch('/api/medicines');
        const data = await res.json();
        setMedicines(data);
      } catch (error) {
        console.error('Error cargando medicamentos:', error);
      }
    };
    fetchMedicines();
  }, []);

  // Función para formatear precios agregando puntos de miles
  const formatPrice = (price: string) => {
    if (!price || price === '$0') return 'Sin precio disponible';
    const cleanPrice = price.replace(/[^0-9]/g, '');
    return '$' + cleanPrice.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Filtrar medicamentos por categoría, búsqueda y farmacia
  const filteredMedicines = medicines.flatMap((pharmacy: any) => {
    return Object.entries(pharmacy.categories || {}).flatMap(([cat, meds]: [string, any[]]) => {
      if (cat.toLowerCase() === category.toLowerCase()) {
        return meds.map((med) => ({ ...med, pharmacy: pharmacy.pharmacy }));
      }
      return [];
    });
  })
    .filter((med) =>
      med.name?.toLowerCase().includes(search.toLowerCase()) &&
      (pharmacyFilter ? med.pharmacy?.toLowerCase() === pharmacyFilter.toLowerCase() : true)
    )
    .sort((a, b) => {
      const priceA = parseInt(a.price?.replace(/[^0-9]/g, '') || '0');
      const priceB = parseInt(b.price?.replace(/[^0-9]/g, '') || '0');
      return sort === 'asc' ? priceA - priceB : priceB - priceA;
    });

  // Obtener medicamentos de la página actual
  const currentMedicines = filteredMedicines.slice(indexOfFirstMedicine, indexOfLastMedicine);
  const totalPages = Math.ceil(filteredMedicines.length / medicinesPerPage);

  return (
    <Container className="py-5">
      {/* Botón de volver */}
      <Button variant="outline-success" className="mb-4" onClick={() => router.push('/comparator/categories')}>
        ← Volver a Categorías
      </Button>

      {/* Título de la categoría */}
      <h1 className="text-center text-success fw-bold mb-2">{category.toUpperCase()}</h1>
      <p className="text-center text-muted mb-4">Explora medicamentos de la categoría seleccionada</p>

      {/* Filtros de búsqueda, farmacia y orden */}
      <Row className="justify-content-center mb-4">
        <Col md={4} className="mb-2">
          <Form.Control
            type="text"
            placeholder="Buscar medicamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col md={3} className="mb-2">
          <Form.Select value={pharmacyFilter} onChange={(e) => setPharmacyFilter(e.target.value)}>
            <option value="">Todas las farmacias</option>
            <option value="Cruz Verde">Cruz Verde</option>
            <option value="Farmacia Ahumada">Farmacia Ahumada</option>
            <option value="Salcobrand">Salcobrand</option>
          </Form.Select>
        </Col>
        <Col md={3} className="mb-2">
          <Form.Select value={sort} onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}>
            <option value="asc">Menor precio</option>
            <option value="desc">Mayor precio</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Mostrar medicamentos o mensaje si no hay */}
      {currentMedicines.length === 0 ? (
        <p className="text-center text-muted">No se encontraron medicamentos en esta categoría.</p>
      ) : (
        <Row className="g-4">
          {currentMedicines.map((med, index) => (
            <Col key={index} sm={6} md={4} lg={3}>
              <Card className="h-100 text-center shadow-sm border-0">
                <Card.Img
                  variant="top"
                  src={med.image || 'https://via.placeholder.com/150'}
                  style={{ height: '120px', objectFit: 'contain' }}
                  alt={med.name}
                />
                <Card.Body>
                  <Card.Title className="text-success fw-bold">
                    {med.name?.charAt(0).toUpperCase() + med.name?.slice(1)}
                  </Card.Title>
                  <Card.Text className="text-muted mb-1">{med.pharmacy}</Card.Text>
                  <Card.Text className="fw-semibold fs-5 text-dark">{formatPrice(med.price)}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Button
            variant="outline-success"
            className="me-2"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline-success"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </Container>
  );
}
