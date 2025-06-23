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
  show,
  onClose,
  onSelect,
}: StockLocationModalProps) {
  const [region, setRegion] = useState('');
  const [commune, setCommune] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch('/data/ahumada_stock_locations.json'); // ✅ Usa cualquiera, son todos iguales
        if (!res.ok) throw new Error('Error al cargar JSON');
        const data = await res.json();
        setLocations(data);
      } catch (error) {
        toast.error('❌ Error al cargar regiones y comunas.');
        setLocations([]);
      }
    };

    fetchLocations();
  }, []);

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
