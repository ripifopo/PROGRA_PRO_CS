export interface FrequentMedicine {
  userEmail: string;
  medicineName: string;
  pharmacy: string;
  category: string;
  savedAt: Date;
  imageUrl?: string;
  medicineSlug?: string;
  categorySlug?: string;
}
