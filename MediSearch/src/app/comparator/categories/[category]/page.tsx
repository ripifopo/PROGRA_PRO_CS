'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, Container, Row, Col, Form } from 'react-bootstrap'

// Este componente representa la página que visualiza los medicamentos de una categoría específica
export default function CategoryPage({ params }: { params: { category: string } }) {
  const router = useRouter()

  // Lista completa de medicamentos agrupados por farmacia
  const [medicines, setMedicines] = useState<any[]>([])

  // Estado del campo de búsqueda
  const [search, setSearch] = useState('')

  // Filtro de farmacia seleccionado
  const [pharmacyFilter, setPharmacyFilter] = useState('')

  // Orden actual de los precios (ascendente o descendente)
  const [sort, setSort] = useState<'asc' | 'desc'>('asc')

  // Página actual de la paginación
  const [currentPage, setCurrentPage] = useState(1)

  // Valores de paginación
  const medicinesPerPage = 12
  const indexOfLastMedicine = currentPage * medicinesPerPage
  const indexOfFirstMedicine = indexOfLastMedicine - medicinesPerPage

  // Categoría actual extraída desde los parámetros de URL
  const [category, setCategory] = useState('')

  // Al montar el componente, se decodifica el parámetro de categoría desde la URL
  useEffect(() => {
    async function unwrapParams() {
      const { category } = await params
      setCategory(decodeURIComponent(category))
    }
    unwrapParams()
  }, [params])

  // Se obtiene la lista completa de medicamentos desde la API
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await fetch('/api/medicines')
        const data = await res.json()
        setMedicines(data)
      } catch (error) {
        console.error('Error cargando medicamentos:', error)
      }
    }
    fetchMedicines()
  }, [])

  // Función para dar formato a los precios con puntos de miles
  const formatPrice = (price: string) => {
    if (!price || price === '$0') return 'Sin precio disponible'
    const cleanPrice = price.replace(/[^0-9]/g, '')
    return '$' + cleanPrice.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Filtra medicamentos que pertenezcan a la categoría seleccionada,
  // que coincidan con la búsqueda por nombre y, si corresponde, por farmacia
  const filteredMedicines = medicines.flatMap((pharmacy: any) => {
    return Object.entries(pharmacy.categories || {}).flatMap(([cat, meds]: [string, any[]]) => {
      if (cat.toLowerCase() === category.toLowerCase()) {
        return meds.map((med) => ({
          ...med,
          pharmacy: pharmacy.pharmacy, // Se añade el nombre de la farmacia a cada medicamento
        }))
      }
      return []
    })
  })
    .filter((med) =>
      med.name?.toLowerCase().includes(search.toLowerCase()) &&
      (pharmacyFilter ? med.pharmacy?.toLowerCase() === pharmacyFilter.toLowerCase() : true)
    )
    .sort((a, b) => {
      const priceA = parseInt(a.price?.replace(/[^0-9]/g, '') || '0')
      const priceB = parseInt(b.price?.replace(/[^0-9]/g, '') || '0')
      return sort === 'asc' ? priceA - priceB : priceB - priceA
    })

  // Se obtienen los medicamentos que se deben mostrar en la página actual
  const currentMedicines = filteredMedicines.slice(indexOfFirstMedicine, indexOfLastMedicine)
  const totalPages = Math.ceil(filteredMedicines.length / medicinesPerPage)

  return (
    <Container className="py-5">
      {/* Botón para volver a la lista general de categorías */}
      <Button variant="outline-success" className="mb-4" onClick={() => router.push('/comparator/categories')}>
        ← Volver a Categorías
      </Button>

      {/* Título y descripción de la categoría */}
      <h1 className="text-center text-success fw-bold mb-2">{category.toUpperCase()}</h1>
      <p className="text-center text-muted mb-4">Explora medicamentos de la categoría seleccionada</p>

      {/* Filtros de búsqueda y orden */}
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

      {/* Resultado de búsqueda o mensaje de error */}
      {currentMedicines.length === 0 ? (
        <p className="text-center text-muted">No se encontraron medicamentos en esta categoría.</p>
      ) : (
        <Row className="g-4">
          {currentMedicines.map((med, index) => (
            <Col key={index} sm={6} md={4} lg={3}>
              {/* Cada tarjeta redirige al detalle del medicamento, usando su nombre codificado como parámetro */}
              <Link
                href={`/comparator/categories/${encodeURIComponent(category)}/${encodeURIComponent(med.name)}`}
                className="text-decoration-none"
              >
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
              </Link>
            </Col>
          ))}
        </Row>
      )}

      {/* Paginación al final de la página */}
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
  )
}
