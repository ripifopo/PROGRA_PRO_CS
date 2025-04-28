// Archivo: src/lib/models/Medicine.ts

// Modelo TypeScript corregido para reflejar exactamente lo scrapeado
export interface Medicine {
  pharmacy: string;           // Nombre de la farmacia ("ahumada", "cruzverde", "salcobrand")
  name: string;               // Nombre del medicamento
  price: string;              // Precio como string, porque puede venir formateado
  description?: string;       // Descripción del producto (opcional)
  form?: string;              // Forma farmacéutica (comprimido, jarabe, etc)
  category?: string;          // Categoría general (ej: "anticonceptivos", "bienestar-sexual")
  stock?: string;             // Stock disponible (opcional) como string ("yes", "no")
  image?: string;             // URL de la imagen (opcional)
  url?: string;               // URL del producto en la farmacia (opcional)
  offer_price?: string;       // Precio oferta (opcional) como string
  normal_price?: string;      // Precio normal (opcional) como string
}
