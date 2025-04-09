// Archivo: src/api/test-db/route.ts

import { connectToDatabase } from "@/lib/mongodb.ts";
import { NextRequest } from "next/server";

// Función para manejar peticiones GET a esta ruta
export async function GET(req: NextRequest) {
  try {
    // Conexión a la base de datos MongoDB
    const db = await connectToDatabase();

    // Ejemplo: se obtiene una colección (crea una dummy si no existe)
    const collection = db.collection("test");

    // Inserción de prueba (se puede eliminar luego)
    await collection.insertOne({ mensaje: "Conexión exitosa a MongoDB Atlas desde Deno" });

    // Se obtiene y retorna todos los documentos de la colección
    const docs = await collection.find({}).toArray();

    return new Response(JSON.stringify(docs), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB:", error);
    return new Response(JSON.stringify({ error: "No se pudo conectar a MongoDB" }), {
      status: 500,
    });
  }
}
