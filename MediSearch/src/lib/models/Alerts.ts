// Archivo: src/lib/models/Alerts.ts

export interface Alert {
  userEmail: string;
  medicineId: number | string;
  medicineName?: string;
  pharmacy: string;
  category: string;
  medicineSlug?: string;
  categorySlug?: string;
  pharmacyUrl?: string;
  imageUrl?: string;
  createdAt: string;
  bioequivalent?: string;
  lastKnownPrice?: string;
  triggered?: boolean; // ✅ Agregado aquí
}
