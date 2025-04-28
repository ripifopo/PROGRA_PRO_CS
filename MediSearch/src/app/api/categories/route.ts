// Archivo: src/app/api/categories/route.ts

import { NextResponse } from "next/server";
import { medicinesCollection } from "../../../lib/mongodb.ts";

// API para obtener las categorías disponibles dinámicamente
export async function GET() {
  try {
    const collection = await medicinesCollection;

    // Busca todas las farmacias disponibles
    const pharmacies = await collection.find({}).toArray();

    // Set para evitar categorías duplicadas
    const categorySet = new Set<string>();

    pharmacies.forEach((pharmacy) => {
      if (pharmacy.categories) {
        for (const category in pharmacy.categories) {
          if (category) categorySet.add(category);
        }
      }
    });

    const categories = Array.from(categorySet);

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error cargando categorías:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
