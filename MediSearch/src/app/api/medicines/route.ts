// Archivo: src/app/api/medicines/route.ts

import { NextResponse } from "next/server";
import { medicinesCollection } from "../../../lib/mongodb.ts";

// Ruta GET para obtener medicamentos
export async function GET() {
  try {
    const medicines = await (await medicinesCollection).find({}).toArray();
    return NextResponse.json(medicines);
  } catch (error) {
    console.error("Error cargando medicamentos:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
