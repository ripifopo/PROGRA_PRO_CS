'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Container, Row, Col, Form, Spinner } from 'react-bootstrap';
import { normalizeCategoryName } from '@/lib/utils/normalizeCategories';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export default function CategoryPage() {
  const router = useRouter();
  const { category: rawCategory } = useParams();

  const [category, setCategory] = useState('');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [pharmacyFilter, setPharmacyFilter] = useState<string[]>([]);
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');
  const [sortDiscount, setSortDiscount] = useState<'asc' | 'desc' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [minDiscount, setMinDiscount] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(100);

  const medicinesPerPage = 12;
  const indexOfLastMedicine = currentPage * medicinesPerPage;
  const indexOfFirstMedicine = indexOfLastMedicine - medicinesPerPage;

  // Normaliza la categoría desde los parámetros
  useEffect(() => {
    if (!rawCategory) return;
    const raw = decodeURIComponent(rawCategory as string);
    const normalized = normalizeCategoryName(raw);
    setCategory(normalized);
  }, [rawCategory]);

  // Obtiene los medicamentos desde la API
  useEffect(() => {
    const fetchMedicines = async () => {
      setLoading(true);
      const res = await fetch('/api/medicines');
      const data = await res.json();
      setMedicines(data);
      setLoading(false);
    };
    fetchMedicines();
  }, []);

  // Formato de precio en CLP
  const formatPrice = (price: string) => {
    if (!price || price === '$0') return 'Sin precio disponible';
    const clean = price.replace(/[^0-9]/g, '');
    return '$' + clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Filtro de medicamentos
  const filteredMedicines = medicines.flatMap((pharmacy: any) => {
    return Object.entries(pharmacy.categories || {}).flatMap(([cat, meds]: [string, any[]]) => {
      if (cat.toLowerCase() === category.toLowerCase()) {
        return meds.map((med) => ({ ...med, pharmacy: pharmacy.pharmacy }));
      }
      return [];
    });
  })
    .filter((med) => {
      const offer = parseInt(med.offer_price?.replace(/[^0-9]/g, '') || '0');
      const discount = parseInt(med.discount || 0);
      const pharmacyOk = pharmacyFilter.length === 0 || pharmacyFilter.includes(med.pharmacy);
      return (
        med.name?.toLowerCase().includes(search.toLowerCase()) &&
        pharmacyOk &&
        offer >= minPrice &&
        offer <= maxPrice &&
        discount >= minDiscount &&
        discount <= maxDiscount
      );
    })
    .sort((a, b) => {
      const priceA = parseInt(a.offer_price?.replace(/[^0-9]/g, '') || '0');
      const priceB = parseInt(b.offer_price?.replace(/[^0-9]/g, '') || '0');
      return sort === 'asc' ? priceA - priceB : priceB - priceA;
    })
    .sort((a, b) => {
      if (!sortDiscount) return 0;
      return sortDiscount === 'asc' ? a.discount - b.discount : b.discount - a.discount;
    });

  const currentMedicines = filteredMedicines.slice(indexOfFirstMedicine, indexOfLastMedicine);
  const totalPages = Math.ceil(filteredMedicines.length / medicinesPerPage);

  // Alterna farmacias seleccionadas
  const togglePharmacy = (value: string) => {
    setCurrentPage(1);
    setPharmacyFilter((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  // Reinicia todos los filtros
  const resetFilters = () => {
    setSearch('');
    setPharmacyFilter([]);
    setSort('asc');
    setSortDiscount('');
    setMinPrice(0);
    setMaxPrice(50000);
    setMinDiscount(0);
    setMaxDiscount(100);
    setCurrentPage(1);
  };

  return (
    <Container className="py-5">
      {/* Botón volver */}
      <Button variant="outline-success" className="mb-4" onClick={() => router.push('/comparator/categories')}>
        ← Volver a Categorías
      </Button>

      {/* Título, subtítulo y barra de búsqueda centrados */}
      <div className="mb-4">
        <Col md={9} className="mx-auto text-center d-flex flex-column align-items-center">
          <h1 className="text-success fw-bold display-5">{category.toUpperCase()}</h1>
          <p className="text-muted fs-5 mb-3">Explora medicamentos disponibles en esta categoría</p>
          <Form.Control
            type="text"
            placeholder="Buscar medicamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-100 w-md-75"
          />
        </Col>
      </div>

      <Row>
        {/* Filtros */}
        <Col md={3}>
          <h5 className="fw-bold">Filtros avanzados</h5>

          {/* Farmacias */}
          <div className="mb-3">
            <strong>Farmacias</strong>
            {['Cruz Verde', 'Salcobrand', 'Farmacia Ahumada'].map((pharm) => (
              <Form.Check
                key={pharm}
                type="checkbox"
                label={pharm}
                checked={pharmacyFilter.includes(pharm)}
                onChange={() => togglePharmacy(pharm)}
              />
            ))}
          </div>

          {/* Precio */}
          <div className="mb-4">
            <strong>Rango de precio</strong>
            <Slider
              range
              min={0}
              max={50000}
              step={500}
              value={[minPrice, maxPrice]}
              onChange={([min, max]) => {
                setMinPrice(min);
                setMaxPrice(max);
              }}
            />
            <div className="d-flex justify-content-between">
              <span>${minPrice}</span>
              <span>${maxPrice}</span>
            </div>
          </div>

          {/* Descuento */}
          <div className="mb-4">
            <strong>Rango de descuento (%)</strong>
            <Slider
              range
              min={0}
              max={100}
              step={1}
              value={[minDiscount, maxDiscount]}
              onChange={([min, max]) => {
                setMinDiscount(min);
                setMaxDiscount(max);
              }}
            />
            <div className="d-flex justify-content-between">
              <span>{minDiscount}%</span>
              <span>{maxDiscount}%</span>
            </div>
          </div>

          {/* Ordenamiento */}
          <div className="mb-3">
            <strong>Ordenar por:</strong>
            <Form.Select className="mt-2" value={sort} onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}>
              <option value="asc">Menor precio</option>
              <option value="desc">Mayor precio</option>
            </Form.Select>

            <Form.Select className="mt-2" value={sortDiscount} onChange={(e) => setSortDiscount(e.target.value as any)}>
              <option value="">No ordenar por descuento</option>
              <option value="asc">Menor descuento</option>
              <option value="desc">Mayor descuento</option>
            </Form.Select>
          </div>

          {/* Botón de reinicio */}
          <Button variant="outline-danger" className="mt-3 w-100" onClick={resetFilters}>
            Reiniciar filtros
          </Button>
        </Col>

        {/* Resultados */}
        <Col md={9}>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
              <Spinner animation="border" variant="success" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
            </div>
          ) : currentMedicines.length === 0 ? (
            <p className="text-center text-muted">No se encontraron medicamentos en esta categoría.</p>
          ) : (
            <Row className="g-4">
              {currentMedicines.map((med, index) => {
                const offer = med.offer_price || '$0';
                const normal = med.normal_price || '$0';
                const hasBothPrices = offer !== normal && normal !== '$0';

                return (
                  <Col key={index} sm={6} md={4} lg={3}>
                    <Link
                      href={`/comparator/categories/${encodeURIComponent(category)}/${encodeURIComponent(med.id || '0')}`}
                      className="text-decoration-none"
                    >
                      <Card className="h-100 text-center shadow-sm border-0">
                        <Card.Img
                          variant="top"
                          src={med.image || 'https://via.placeholder.com/150'}
                          style={{ height: '120px', objectFit: 'contain' }}
                          alt={med.name || 'Medicamento'}
                        />
                        <Card.Body>
                          <Card.Title className="text-success fw-bold">
                            {med.name || 'Sin nombre'}
                          </Card.Title>
                          <Card.Text className="text-muted mb-1">{med.pharmacy}</Card.Text>

                          {hasBothPrices ? (
                            <>
                              <Card.Text className="text-muted text-decoration-line-through">
                                {formatPrice(normal)}
                              </Card.Text>
                              <Card.Text className="fw-semibold fs-5 text-danger mb-1">
                                {formatPrice(offer)}
                              </Card.Text>
                              {med.discount > 0 && (
                                <Card.Text className="text-success small">
                                  {med.discount}% de descuento
                                </Card.Text>
                              )}
                            </>
                          ) : (
                            <Card.Text className="fw-semibold fs-5 text-dark">
                              {formatPrice(offer !== '$0' ? offer : normal)}
                            </Card.Text>
                          )}
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                );
              })}
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
        </Col>
      </Row>
    </Container>
  );
}
