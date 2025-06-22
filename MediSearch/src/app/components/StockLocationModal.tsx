// Archivo: src/components/StockLocationModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
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
  const filteredCommunes = locations.filter((loc) => loc.region === region).map((loc) => loc.commune);

  const handleConfirm = () => {
    if (region && commune) {
      localStorage.setItem('selectedRegion', region);
      localStorage.setItem('selectedCommune', commune);
      onSelect(region, commune);
      onClose();
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>📍 Selecciona tu ubicación</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="mb-3 text-muted">
          Elige una región y comuna para personalizar la visualización del stock.
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
        <Button variant="outline-secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleConfirm} disabled={!region || !commune}>
          ✅ Confirmar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
