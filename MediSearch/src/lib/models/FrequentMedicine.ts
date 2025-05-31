// Archivo: src/lib/models/FrequentMedicine.ts

export interface FrequentMedicine {
  userEmail: string;
  medicineId: number | string;        // ← ID del medicamento como clave principal
  medicineName?: string;              // ← Puede venir vacío o null
  pharmacy: string;
  category: string;
  savedAt: Date;
  imageUrl?: string;
  medicineSlug?: string;
  categorySlug?: string;
  pharmacyUrl?: string;
}
