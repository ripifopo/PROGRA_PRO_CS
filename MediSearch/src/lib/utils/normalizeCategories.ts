export function normalizeCategoryName(raw: string): string {
  const lower = raw.toLowerCase().trim();

  // Diccionario base de agrupaciones manuales por raíz común o sinónimos conocidos
  const mappings: Record<string, string> = {
    "dolor fiebre e inflamacion": "dolor y fiebre",
    "dolor fiebre y antiflamatorios": "dolor y fiebre",
    "dolor fiebre y antiiflamatorios": "dolor y fiebre",
    "dolor y fiebre": "dolor y fiebre",
    "antiinflamatorios": "dolor y fiebre",

    "antiobesidad y diabetes": "diabetes",
    "diabetes": "diabetes",

    "dermatologico": "dermatología",
    "dermatologia": "dermatología",
    "dermatologicos": "dermatología",
    "dermatológicos": "dermatología",

    "hipertension": "hipertensión",
    "hipertensión": "hipertensión",

    "sistema digestivo": "digestivo",
    "digestivo": "digestivo",

    "respiratorio y alergias": "respiratorio",
    "sistema respiratorio y alergias": "respiratorio"
  };

  // Limpieza más robusta: quitar tildes, reemplazar guiones, espacios dobles, etc.
  const normalized = lower
    .normalize("NFD") // separa letras y tildes
    .replace(/\p{Diacritic}/gu, "") // elimina tildes
    .replace(/-/g, " ") // reemplaza guiones por espacio
    .replace(/\s+/g, " ") // elimina espacios dobles
    .trim();

  // Devuelve la categoría agrupada si existe, si no, retorna la original normalizada
  return mappings[normalized] || normalized;
}
