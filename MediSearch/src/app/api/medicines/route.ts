// Archivo: src/app/api/medicines/route.ts

import { NextResponse } from "next/server";
import { medicinesCollection } from "../../../lib/mongodb.ts";

// Ruta API que maneja la obtención de medicamentos disponibles
export async function GET() {
  try {
    // Se accede a la colección de medicamentos en la base de datos
    const medicines = await (await medicinesCollection).find({}).toArray();

    // Se responde con el listado completo de medicamentos en formato JSON
    return NextResponse.json(medicines);
  } catch (error) {
    // Manejo de errores en caso de fallo durante la carga de datos
    console.error("Error cargando medicamentos:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
