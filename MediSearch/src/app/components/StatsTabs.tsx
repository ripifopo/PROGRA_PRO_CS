// ✅ Archivo: src/app/components/StatsTabs.tsx

'use client';

import { Tabs, Tab } from 'react-bootstrap';
import PriceTrendChart from './PriceTrendChart';
import SimilarAlternatives from './SimilarAlternatives';

interface Props {
  medicineId: number;
  pharmacy: string;
  category: string;
  name: string; // 🔧 <-- agregar esta línea
}

export default function StatsTabs({ medicineId, pharmacy, category, name }: Props) {
  return (
    <>
      <hr className="my-5 border-top border-2 border-secondary opacity-25" />
      <h4 className="fw-bold text-success mb-3">Estadísticas y Recomendaciones</h4>

      <Tabs defaultActiveKey="trend" id="stats-tabs" className="mb-3">
        <Tab eventKey="trend" title="Historial de Precios">
          <PriceTrendChart medicineId={medicineId} pharmacy={pharmacy} compact={false} />
        </Tab>
        <Tab eventKey="alternatives" title="Alternativas Similares">
          <SimilarAlternatives medicineId={medicineId} category={category} name={name} />
        </Tab>
      </Tabs>
    </>
  );
}
