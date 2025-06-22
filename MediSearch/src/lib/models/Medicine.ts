// Representa la estructura final en la colección `medicines`
export interface MedicineDocument {
  pharmacy: string; // Ej: "Cruz Verde", "Salcobrand"
  lastUpdated: string; // Fecha del último scrapeo (formato: "YYYY-MM-DD")
  categories: {
    [category: string]: MedicineEntry[];
  };
}

// Información detallada del medicamento
export interface MedicineEntry {
  id: number | null;             // ID del producto
  name: string;                  // Nombre del medicamento
  offer_price: string;           // Precio de oferta (ej: "$1990")
  normal_price: string;          // Precio normal (ej: "$2490")
  discount: number;              // Porcentaje de descuento
  url: string;                   // Enlace al producto
  image: string;                 // URL de la imagen
  category: string;              // Categoría del medicamento (normalizada)
  bioequivalent: string;         // Indicador de bioequivalencia (ej: "Sí", "No", "No aplica")
  stock: string;                 // Nuevo campo agregado: "yes" o "no"
}
