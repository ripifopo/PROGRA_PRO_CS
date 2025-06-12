// Para uso en Next.js (no usar "npm:" ni Deno imports)
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("No se encontró MONGODB_URI");

const client = new MongoClient(uri);
const db = client.db("medisearch");

export const medicinesCollection = db.collection("medicines");
export const priceHistoryCollection = db.collection("price_history");
export const usersCollection = db.collection("users");
export const frequentMedicinesCollection = db.collection("frequent_medicines");
export const alertsCollection = db.collection("alerts");
export const verifiedUsersCollection = db.collection("verified_users");