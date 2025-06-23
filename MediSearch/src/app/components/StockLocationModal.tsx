'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt } from 'react-icons/fa';

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

export default function StockLocationModal({
  pharmacy,
  productUrl,
  show,
  onClose,
  onSelect,
}: StockLocationModalProps) {
  const [region, setRegion] = useState('');
  const [commune, setCommune] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!pharmacy) return;

      const normalized = pharmacy.toLowerCase();
      let path = '';

      if (normalized.includes('ahumada')) {
        path = '/stock/zones/ahumada_stock_locations.json';
      } else if (normalized.includes('cruz verde')) {
        path = '/stock/zones/cruzverde_stock_locations.json';
      } else if (normalized.includes('salcobrand')) {
        path = '/stock/zones/salcobrand_stock_locations.json';
      } else {
        setLocations([]);
        return;
      }

      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error('404');
        const data = await res.json();
        setLocations(data);
      } catch {
        toast.error('❌ Error al cargar ubicaciones desde el archivo JSON.');
        setLocations([]);
      }
    };

    fetchLocations();
  }, [pharmacy]);

  const uniqueRegions = [...new Set(locations.map((loc) => loc.region))];
  const filteredCommunes = locations
    .filter((loc) => loc.region === region)
    .map((loc) => loc.commune);

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
        <Modal.Title className="d-flex align-items-center gap-2">
          <FaMapMarkerAlt color="hotpink" />
          Selecciona tu ubicación
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="mb-3 text-muted text-center" style={{ fontSize: '0.95rem' }}>
          Elige una <strong>región</strong> y <strong>comuna</strong> para personalizar la visualización del stock.
        </p>

        <Form.Group className="mb-3">
          <Form.Label>🌎 Región</Form.Label>
          <Form.Select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setCommune('');
            }}
          >
            <option value="">Selecciona una región</option>
            {uniqueRegions.map((reg, i) => (
              <option key={i} value={reg}>{reg}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group>
          <Form.Label>🏙️ Comuna</Form.Label>
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

      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="success"
          onClick={handleConfirm}
          disabled={!region || !commune}
        >
          ✅ Confirmar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
