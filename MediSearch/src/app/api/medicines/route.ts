// Archivo: src/app/api/medicines/route.ts

import { NextResponse } from "next/server";
import { medicinesCollection } from "../../../lib/mongodb.ts";
import { normalizeCategoryName } from "../../../lib/utils/normalizeCategories.ts";

// Ruta API que entrega medicamentos agrupados por farmacia y categoría
export async function GET() {
  try {
    const collection = await medicinesCollection;
    const pharmacies = await collection.find({}).toArray();

    const result = pharmacies.map((pharmacy) => {
      const normalizedCategories: Record<string, any[]> = {};

      for (const rawCategory in pharmacy.categories) {
        const normalized = normalizeCategoryName(rawCategory);

        if (!normalizedCategories[normalized]) {
          normalizedCategories[normalized] = [];
        }

        normalizedCategories[normalized].push(...pharmacy.categories[rawCategory]);
      }

      return {
        pharmacy: pharmacy.pharmacy,
        categories: normalizedCategories
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error cargando medicamentos:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
