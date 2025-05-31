// Archivo: src/lib/models/Alerts.ts

export interface Alert {
  userEmail: string;            // Correo del usuario
  medicineId: number | string; // ← ID del medicamento como clave principal
  medicineName?: string;        // Nombre puede estar vacío o ser null
  pharmacy: string;             // Farmacia donde fue encontrado
  category: string;             // Categoría a la que pertenece
  medicineSlug?: string;        // Slug amigable para redirigir
  categorySlug?: string;        // Slug amigable de categoría
  pharmacyUrl?: string;         // URL para ir al producto
  imageUrl?: string;            // Imagen del medicamento
  createdAt: string;            // Fecha de creación (ISO)
}
