// Archivo: src/app/api/categories/route.ts

import { NextResponse } from "next/server";
import { medicinesCollection } from "../../../lib/mongodb.ts";
import { normalizeCategoryName } from "../../../lib/utils/normalizeCategories.ts";

// API que devuelve las categorías agrupadas y normalizadas
export async function GET() {
  try {
    const collection = await medicinesCollection;
    const pharmacies = await collection.find({}).toArray();

    const categorySet = new Set<string>();

    pharmacies.forEach((pharmacy) => {
      if (pharmacy.categories) {
        for (const rawCategory in pharmacy.categories) {
          const normalized = normalizeCategoryName(rawCategory);
          categorySet.add(normalized);
        }
      }
    });

    const categories = Array.from(categorySet).sort();

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error cargando categorías:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
