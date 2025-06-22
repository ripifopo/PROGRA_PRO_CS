// Archivo: src/components/StockLocationModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ahumadaData from '@/stock/zones/ahumada_stock_locations.json';
import cruzverdeData from '@/stock/zones/cruzverde_stock_locations.json';
import salcobrandData from '@/stock/zones/salcobrand_stock_locations.json';

interface Location {
  region: string;
  commune: string;
}

interface StockLocationModalProps {
  pharmacy: string | undefined;
  productUrl: string | undefined;
  show: boolean;
  onClose: () => void;
  onSelect: (region: string, commune: string) => void;
}

export default function StockLocationModal({ pharmacy, productUrl, show, onClose, onSelect }: StockLocationModalProps) {
  const [region, setRegion] = useState('');
  const [commune, setCommune] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (!pharmacy) {
      setLocations([]);
      return;
    }

    const normalized = pharmacy.toLowerCase();

    if (normalized.includes('ahumada')) {
      setLocations(ahumadaData);
    } else if (normalized.includes('cruz verde')) {
      setLocations(cruzverdeData);
    } else if (normalized.includes('salcobrand')) {
      setLocations(salcobrandData);
    } else {
      setLocations([]);
    }
  }, [pharmacy]);

  const uniqueRegions = [...new Set(locations.map((loc) => loc.region))];
  const filteredCommunes = locations
    .filter((loc) => loc.region === region)
    .map((loc) => loc.commune);

  const handleConfirm = async () => {
    if (region && commune && productUrl) {
      try {
        const res = await fetch('/api/stock/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: productUrl, comuna: commune })
        });
        const data = await res.json();
        toast.info(`Resultado stock: ${data.result}`);
      } catch {
        toast.error('Error al verificar stock');
      }

      onSelect(region, commune);
      onClose();
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Seleccionar ubicación de stock</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="mb-3 text-muted">
          Selecciona una región y comuna para consultar el stock disponible en tu zona.
        </p>

        <Form.Group className="mb-3">
          <Form.Label>Región</Form.Label>
          <Form.Select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">Selecciona una región</option>
            {uniqueRegions.map((reg, i) => (
              <option key={i} value={reg}>{reg}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Comuna</Form.Label>
          <Form.Select
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            disabled={!region}
          >
            <option value="">Selecciona una comuna</option>
            {filteredCommunes.map((com, i) => (
              <option key={i} value={com}>{com}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleConfirm} disabled={!region || !commune}>
          Aceptar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
