// Archivo: src/lib/mongodb.ts

import { MongoClient, Db, Collection } from "mongodb";

// Se obtiene la URI desde el archivo .env
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("No se encontró la URI de conexión a MongoDB");
}

// Variable global para evitar crear múltiples conexiones en desarrollo
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Solo crea una instancia si aún no existe
let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

// Exporta la colección una vez la conexión esté lista
export const usersCollection: Promise<Collection> = clientPromise.then(client =>
  client.db("medisearch").collection("users")
);
