'use client';

import { Card, Badge } from 'react-bootstrap';
import Link from 'next/link';

interface Medicine {
  medicineId?: number;
  name: string;
  pharmacy: string;
  offer_price?: number;
  normal_price?: number;
  image_url?: string;
  bioequivalent?: boolean;
}

interface EquivalentCardProps {
  med: Medicine;
  categorySlug?: string;
}

export default function EquivalentCard({ med, categorySlug }: EquivalentCardProps) {
  const imgSrc = med.image_url || 'https://via.placeholder.com/150x150?text=MED';

  const formatPrice = (price?: number) => {
    return price ? '$' + price.toLocaleString('es-CL') : 'No disponible';
  };

  const hasDiscount = med.normal_price && med.offer_price && med.offer_price < med.normal_price;
  const discount = hasDiscount
    ? Math.round(100 - (med.offer_price! * 100) / med.normal_price!)
    : 0;

  return (
    <Card className="h-100 border-0 shadow-sm rounded-3">
      <Card.Img
        variant="top"
        src={imgSrc}
        alt={med.name}
        className="p-3"
        style={{ height: '160px', objectFit: 'contain' }}
      />
      <Card.Body className="d-flex flex-column justify-content-between">
        <div className="mb-3 text-center">
          <h6 className="fw-bold text-success">{med.name}</h6>
          <p className="text-muted mb-1">{med.pharmacy}</p>
          {hasDiscount && (
            <p className="text-muted text-decoration-line-through small">
              {formatPrice(med.normal_price)}
            </p>
          )}
          <p className="fw-bold text-danger fs-5">{formatPrice(med.offer_price)}</p>
          {hasDiscount && (
            <Badge bg="success" className="mb-2">{discount}% dcto.</Badge>
          )}
          <div>
            <Badge bg={med.bioequivalent ? 'success' : 'warning'}>
              {med.bioequivalent ? 'Genérico' : 'Marca'}
            </Badge>
          </div>
        </div>

        <Link
          href={
            med.medicineId && categorySlug
              ? `/comparator/categories/${encodeURIComponent(categorySlug)}/${encodeURIComponent(med.medicineId)}`
              : '#'
          }
          className="btn btn-outline-primary btn-sm w-100"
        >
          Ver detalles
        </Link>
      </Card.Body>
    </Card>
  );
}
