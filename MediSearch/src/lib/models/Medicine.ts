// Archivo: src/lib/models/Medicine.ts

// Representa la estructura final en la colección `medicines`
export interface MedicineDocument {
  pharmacy: string; // Ej: "Cruz Verde", "Salcobrand"
  categories: {
    [category: string]: MedicineEntry[]; // Cada categoría contiene un array de medicamentos
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
  stock: string;                 // Ej: "yes", "no"
  category: string;              // Categoría del medicamento (normalizada)
}
