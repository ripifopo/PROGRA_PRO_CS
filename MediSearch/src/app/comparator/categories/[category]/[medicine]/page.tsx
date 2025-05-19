'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Spinner, Card } from 'react-bootstrap'
import { toast } from 'react-toastify'

// Interfaz que define la estructura de un medicamento
interface Medicine {
  name: string
  price: string
  image: string
  url: string
  form: string
  stock: number
  description: string
  pharmacy?: string
}

// Este componente muestra la página de detalle de un medicamento específico buscado por nombre dentro de una categoría
export default function MedicineDetailPage() {
  const { category, medicine } = useParams()
  const router = useRouter()

  const [medData, setMedData] = useState<Medicine | null>(null) // Datos del medicamento encontrado
  const [loading, setLoading] = useState<boolean>(true) // Estado de carga

  // Al cargar el componente, se obtiene toda la base de medicamentos
  // Luego se busca el medicamento cuyo nombre coincida dentro de la categoría específica
  useEffect(() => {
    const fetchAndMatchMedicine = async () => {
      try {
        const res = await fetch('/api/medicines')
        if (!res.ok) throw new Error()
        const data = await res.json()

        const decodedCategory = decodeURIComponent(category as string)
        const decodedName = decodeURIComponent(medicine as string)

        let found: Medicine | null = null

        // Se recorre cada farmacia
        for (const pharmacy of data) {
          const categories = pharmacy.categories || {}

          // Se busca únicamente dentro de la categoría especificada
          for (const [catName, meds] of Object.entries(categories)) {
            if (catName.toLowerCase() === decodedCategory.toLowerCase()) {
              const match = (meds as any[]).find((m) => m.name === decodedName)
              if (match) {
                found = { ...match, pharmacy: pharmacy.pharmacy }
                break
              }
            }
          }

          if (found) break
        }

        if (!found) throw new Error()
        setMedData(found)
      } catch {
        toast.error('Medicamento no encontrado.')
        router.push(`/comparator/categories/${category}`)
      } finally {
        setLoading(false)
      }
    }

    fetchAndMatchMedicine()
  }, [medicine, category, router])

  // Mientras carga la información o no se ha encontrado aún, se muestra un spinner
  if (loading || !medData) {
    return (
      <div className="container text-center py-5">
        <Spinner animation="border" variant="success" />
      </div>
    )
  }

  return (
    <div className="container py-5">
      <Card className="shadow-lg">
        <div className="row g-0">
          {/* Imagen del medicamento */}
          <div className="col-md-4 d-flex align-items-center justify-content-center p-3">
            <img
              src={medData.image}
              alt={medData.name}
              className="img-fluid rounded"
              style={{ maxHeight: '250px', objectFit: 'contain' }}
            />
          </div>

          {/* Información del medicamento */}
          <div className="col-md-8 p-4">
            <h3 className="text-success">{medData.name}</h3>
            <p><strong>Precio:</strong> {medData.price}</p>
            <p><strong>Forma:</strong> {medData.form}</p>
            <p><strong>Stock:</strong> {medData.stock > 0 ? 'Disponible' : 'Sin stock'}</p>
            <p><strong>Farmacia:</strong> {medData.pharmacy}</p>
            <p><strong>Descripción:</strong> {medData.description}</p>
            <p>
              <strong>Ver en farmacia:</strong>{' '}
              <a href={medData.url} target="_blank" rel="noopener noreferrer">
                Ir al sitio web
              </a>
            </p>

            {/* Botón para volver a la categoría */}
            <Button variant="secondary" onClick={() => router.push(`/comparator/categories/${category}`)}>
              ← Volver a medicamentos
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
