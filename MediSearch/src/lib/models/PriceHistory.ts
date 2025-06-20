// Archivo: src/lib/models/PriceHistory.ts

// Representa un historial por farmacia
export interface PriceHistoryDocument {
  pharmacy: string; // Ej: "Cruz Verde", "Farmacia Ahumada"
  snapshots: {
    [snapshotDate: string]: {
      [category: string]: PriceHistoryEntry[]; // Cada fecha contiene categorías y cada categoría medicamentos
    };
  };
}

// Información básica de precios para comparación histórica
export interface PriceHistoryEntry {
  id: number | null;           // ID del medicamento (puede repetirse entre fechas)
  name: string;                // Nombre del medicamento (útil para buscar en caso de IDs inconsistentes)
  offer_price: string;         // Precio de oferta
  normal_price: string;        // Precio normal
  discount: number;            // Descuento aplicado
  category?: string;           // Categoría del producto (opcional)
}
