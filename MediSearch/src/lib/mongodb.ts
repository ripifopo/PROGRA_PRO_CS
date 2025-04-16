// Archivo: src/lib/mongodb.ts

import { MongoClient } from "npm:mongodb";

// Se obtiene la URI de conexión desde el archivo .env
const uri = Deno.env.get("MONGODB_URI");

// Se verifica que la URI esté definida
if (!uri) {
  throw new Error("No se encontró la URI de conexión a MongoDB en el archivo .env");
}

// Se crea una nueva instancia del cliente y se conecta a la base de datos
const client = new MongoClient();
await client.connect(uri);

// Se selecciona la base de datos llamada "medisearch"
const db = client.db("medisearch");

// Se exporta la colección de usuarios para uso en rutas de la API
export const usersCollection = db.collection("users");
