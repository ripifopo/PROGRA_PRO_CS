// Archivo: lib/mongodb.ts

import { MongoClient } from "npm:mongodb";

// URL de conexión obtenida desde el archivo .env
const uri = Deno.env.get("MONGODB_URI");

// Validación: Si no se encuentra la variable, lanzar error
if (!uri) {
  throw new Error("La variable MONGODB_URI no está definida en el archivo .env");
}

// Se crea una instancia de cliente de MongoDB con la URI
const client = new MongoClient(uri);

// Función para obtener la base de datos específica
export async function connectToDatabase() {
  // Se conecta con el servidor solo si aún no está conectado
  if (!client.isConnected?.()) {
    await client.connect();
  }

  // Se retorna el acceso a la base de datos. Puedes cambiar el nombre si tu base no se llama "medisearch"
  const db = client.db("medisearch");
  return db;
}
