import { MongoClient, Db, Collection } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("No se encontró la URI de conexión a MongoDB");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export const usersCollection: Promise<Collection> = clientPromise.then(client =>
  client.db("medisearch").collection("users")
);

export const medicinesCollection: Promise<Collection> = clientPromise.then(client =>
  client.db("medisearch").collection("medicines")
);

export const frequentMedicinesCollection: Promise<Collection> = clientPromise.then(client =>
  client.db("medisearch").collection("frequent_medicines")
);
export const alertsCollection: Promise<Collection> = clientPromise.then(client =>
  client.db("medisearch").collection("alerts")
);
