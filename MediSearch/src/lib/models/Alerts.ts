// Archivo: src/lib/models/Alerts.ts

// Modelo TypeScript que define la estructura de una alerta
export interface Alert {
  userEmail: string;            // Correo del usuario
  medicineName: string;         // Nombre del medicamento
  pharmacy: string;             // Farmacia donde fue encontrado
  category: string;             // Categoría a la que pertenece
  medicineSlug: string;         // Slug amigable para redirigir
  categorySlug: string;         // Slug amigable de categoría
  pharmacyUrl?: string;         // URL para ir al producto
  imageUrl?: string;            // Imagen del medicamento
  createdAt: string;            // Fecha de creación
}
