'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Container, Row, Col, Form, Spinner, Badge } from 'react-bootstrap';
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

  const [minPrice, setMinPrice] = useState(1);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [minDiscount, setMinDiscount] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(100);

  const medicinesPerPage = 12;
  const indexOfLastMedicine = currentPage * medicinesPerPage;
  const indexOfFirstMedicine = indexOfLastMedicine - medicinesPerPage;

  useEffect(() => {
    if (!rawCategory) return;
    const raw = decodeURIComponent(rawCategory as string);
    const normalized = normalizeCategoryName(raw);
    setCategory(normalized);
  }, [rawCategory]);

  useEffect(() => {
    const fetchMedicines = async () => {
      setLoading(true);
      const res = await fetch('/api/medicines');
      const data = await res.json();
      setMedicines(data);

      const prices = data.flatMap((pharmacy: any) => {
        const entries = Object.entries(pharmacy.categories || {});
        return entries.flatMap(([cat, meds]) => {
          if (typeof cat !== 'string' || !Array.isArray(meds)) return [];
          if (cat.toLowerCase() !== category.toLowerCase()) return [];
          return meds
            .map((med) => parseInt(med.offer_price?.replace(/[^0-9]/g, '') || '0'))
            .filter((p) => p > 0);
        });
      });

      const maxDetected = Math.max(...prices);
      setMinPrice(1);
      setMaxPrice(isFinite(maxDetected) && maxDetected > 0 ? maxDetected : 1000000);
      setLoading(false);
    };

    fetchMedicines();
  }, [category]);

  const formatPrice = (price: string) => {
    if (!price || price === '$0') return 'No disponible';
    const clean = price.replace(/[^0-9]/g, '');
    return '$' + clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const filteredMedicines = medicines.flatMap((pharmacy: any) => {
    const entries = Object.entries(pharmacy.categories || {});
    return entries.flatMap(([cat, meds]) => {
      if (typeof cat !== 'string' || !Array.isArray(meds)) return [];
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

  const togglePharmacy = (value: string) => {
    setCurrentPage(1);
    setPharmacyFilter((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const resetFilters = () => {
    setSearch('');
    setPharmacyFilter([]);
    setSort('asc');
    setSortDiscount('');
    setMinPrice(1);
    setMaxPrice(1000000);
    setMinDiscount(0);
    setMaxDiscount(100);
    setCurrentPage(1);
  };

  return (
    <Container className="py-5">
      <Button variant="outline-success" className="mb-4" onClick={() => router.push('/comparator/categories')}>
        ← Volver a Categorías
      </Button>

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
        <Col md={3}>
          <Card className="p-3 shadow-sm mb-4">
            <h5 className="fw-bold mb-3">Filtros avanzados</h5>

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

            <div className="mb-4">
              <strong>Rango de precio</strong>
              <Slider
                range
                min={1}
                max={maxPrice}
                step={500}
                value={[minPrice, maxPrice]}
                onChange={(value) => {
                  if (Array.isArray(value) && value.length === 2) {
                    setMinPrice(value[0]);
                    setMaxPrice(value[1]);
                  }
                }}
              />
              <div className="d-flex justify-content-between">
                <span>${minPrice}</span>
                <span>${maxPrice}</span>
              </div>
            </div>

            <div className="mb-4">
              <strong>Rango de descuento (%)</strong>
              <Slider
                range
                min={0}
                max={100}
                step={1}
                value={[minDiscount, maxDiscount]}
                onChange={(value) => {
                  if (Array.isArray(value) && value.length === 2) {
                    setMinDiscount(value[0]);
                    setMaxDiscount(value[1]);
                  }
                }}
              />
              <div className="d-flex justify-content-between">
                <span>{minDiscount}%</span>
                <span>{maxDiscount}%</span>
              </div>
            </div>

            <Form.Select className="mt-2" value={sort} onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}>
              <option value="asc">Menor precio</option>
              <option value="desc">Mayor precio</option>
            </Form.Select>

            <Form.Select className="mt-2" value={sortDiscount} onChange={(e) => setSortDiscount(e.target.value as any)}>
              <option value="">No ordenar por descuento</option>
              <option value="asc">Menor descuento</option>
              <option value="desc">Mayor descuento</option>
            </Form.Select>

            <Button variant="outline-danger" className="mt-3 w-100" onClick={resetFilters}>
              Reiniciar filtros
            </Button>
          </Card>
        </Col>

        <Col md={9}>
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-3">Cargando medicamentos...</p>
            </div>
          ) : currentMedicines.length === 0 ? (
            <div className="text-center my-5">
              <h4>No se encontraron medicamentos en esta categoría</h4>
              <p>Intenta ajustar los filtros o buscar otro término.</p>
            </div>
          ) : (
            <Row className="g-4">
              {currentMedicines.map((med, index) => {
                const offer = med.offer_price || '$0';
                const normal = med.normal_price || '$0';
                const hasDiscount = offer !== normal && normal !== '$0';
                const imageUrl = med.image && med.image.trim() !== '' ? med.image : 'https://via.placeholder.com/150';

                return (
                  <Col key={`${med.id}-${index}`} md={6} lg={4}>
                    <Card className="shadow-sm h-100">
                      <Card.Img variant="top" src={imageUrl} style={{ height: '150px', objectFit: 'contain' }} />
                      <Card.Body className="text-center">
                        <h5 className="text-success fw-bold">{med.name || 'Sin nombre'}</h5>
                        <p className="text-muted mb-1">{med.pharmacy}</p>
                        {hasDiscount && (
                          <p className="text-muted text-decoration-line-through">
                            {formatPrice(normal)}
                          </p>
                        )}
                        <p className="text-danger fw-bold fs-5">{formatPrice(offer)}</p>
                        {parseInt(med.discount) > 0 && (
                          <Badge bg="success" className="mb-2">
                            {med.discount}% de descuento
                          </Badge>
                        )}
                        <Link
                          href={`/comparator/categories/${encodeURIComponent(category)}/${encodeURIComponent(med.id || '0')}`}
                          className="btn btn-outline-success w-100 mt-2"
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

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4 align-items-center gap-3">
              <Button variant="outline-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>
                Anterior
              </Button>
              <span className="fw-semibold">Página {currentPage} de {totalPages}</span>
              <Button variant="outline-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}
