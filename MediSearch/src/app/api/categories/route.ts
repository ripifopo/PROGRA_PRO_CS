// Archivo: src/app/api/categories/route.ts

import { NextResponse } from "next/server";
import { medicinesCollection } from "../../../lib/mongodb.ts";

// API que maneja la obtención dinámica de categorías de medicamentos
export async function GET() {
  try {
    // Se accede a la colección de medicamentos en la base de datos
    const collection = await medicinesCollection;

    // Se buscan todos los documentos de farmacias disponibles
    const pharmacies = await collection.find({}).toArray();

    // Conjunto utilizado para almacenar categorías únicas
    const categorySet = new Set<string>();

    // Se recorren todas las farmacias para extraer las categorías
    pharmacies.forEach((pharmacy) => {
      if (pharmacy.categories) {
        for (const category in pharmacy.categories) {
          if (category) categorySet.add(category);
        }
      }
    });

    // Se convierte el conjunto en un arreglo para enviarlo como respuesta
    const categories = Array.from(categorySet);

    // Respuesta exitosa con el listado de categorías únicas
    return NextResponse.json(categories);
  } catch (error) {
    // Manejo de errores internos en la carga de categorías
    console.error("Error cargando categorías:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
