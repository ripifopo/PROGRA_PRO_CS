// testConnection.ts
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { MongoClient } from "npm:mongodb@6.17.0";

const uri = Deno.env.get("MONGODB_URI");
if (!uri) throw new Error("No URI");

const client = new MongoClient(uri);
await client.connect();

console.log("✅ Conexión exitosa a MongoDB");

await client.close();
