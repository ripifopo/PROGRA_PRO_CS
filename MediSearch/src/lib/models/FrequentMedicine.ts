// Modelo TypeScript para representar un medicamento frecuente guardado por un usuario
export interface FrequentMedicine {
  userEmail: string;        // Email del usuario (clave de identificación)
  medicineName: string;     // Nombre del medicamento guardado
  pharmacy: string;         // Farmacia asociada al medicamento (ahumada, cruzverde, salcobrand)
  category: string;         // Categoría original del medicamento (por ejemplo: "anticonceptivos")
  savedAt: Date;            // Fecha en que el usuario lo marcó como frecuente
}
