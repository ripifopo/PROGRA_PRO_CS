/// <reference lib="deno.ns" />
// Archivo: scraping_tasks/insertMedicines.ts

import "https://deno.land/std@0.224.0/dotenv/load.ts?path=../.env";
import { MongoClient } from "npm:mongodb@6.17.0";
import { normalizeCategoryName } from "../src/lib/utils/normalizeCategories.ts";

// ✅ Carga y valida la URI desde .env
const uri = Deno.env.get("MONGODB_URI");
if (!uri) throw new Error("❌ No se encontró MONGODB_URI en las variables de entorno");

const client = new MongoClient(uri);
const db = client.db("medisearch");

const medicinesCollection = db.collection("medicines");
const priceHistoryCollection = db.collection("price_history");

const updatesPath = "../Scrapers_MediSearch/product_updates";

// 🔧 Nombre bonito de farmacia
function transformarNombreFarmacia(nombre: string): string {
  const lower = nombre.toLowerCase();
  if (lower === "cruzverde") return "Cruz Verde";
  if (lower === "salcobrand") return "Salcobrand";
  if (lower === "ahumada") return "Farmacia Ahumada";
  return nombre;
}

// 💲 Formato CLP
function formatPriceCLP(value: any): string {
  const num = typeof value === "string" ? parseInt(value.replace(/\D/g, '')) :
              typeof value === "number" ? value : 0;
  return isFinite(num) ? `$${num.toLocaleString("es-CL")}` : "$0";
}

// 🧠 Función principal
async function insertMedicinesFromUpdates() {
  try {
    console.log("✨ Conectado a la base de datos");

    await medicinesCollection.deleteMany({});
    console.log("🧽 Colección de medicamentos reiniciada");

    for await (const pharmacyDir of Deno.readDir(updatesPath)) {
      if (!pharmacyDir.isDirectory) continue;

      const pharmacyName = transformarNombreFarmacia(pharmacyDir.name);
      const pathFarmacia = `${updatesPath}/${pharmacyDir.name}`;

      const fechasDisponibles: string[] = [];
      for await (const fechaDir of Deno.readDir(pathFarmacia)) {
        if (fechaDir.isDirectory) fechasDisponibles.push(fechaDir.name);
      }

      fechasDisponibles.sort((a, b) => b.localeCompare(a));
      const carpetaMasReciente = fechasDisponibles[0];

      const farmaciaDoc: any = {
        pharmacy: pharmacyName,
        categories: {}
      };

      const historialPrevio = await priceHistoryCollection.findOne({ pharmacy: pharmacyName });
      const priceHistoryDoc: any = {
        pharmacy: pharmacyName,
        snapshots: historialPrevio?.snapshots || {}
      };

      for (const fechaFolder of fechasDisponibles) {
        const fullFolderPath = `${pathFarmacia}/${fechaFolder}`;
        const snapshot = {};

        for await (const archivo of Deno.readDir(fullFolderPath)) {
          if (!archivo.isFile || !archivo.name.endsWith(".json")) continue;

          const categoryRaw = archivo.name.replace(".json", "").replace(/-/g, " ");
          const categoryName = normalizeCategoryName(categoryRaw);
          const jsonPath = `${fullFolderPath}/${archivo.name}`;

          const rawData = await Deno.readTextFile(jsonPath);
          const parsed = JSON.parse(rawData);
          const productos = Array.isArray(parsed) ? parsed : [parsed];

          const meds = productos.map((med) => {
            const rawOffer = med.price_offer ?? med.offer_price ?? 0;
            const rawNormal = med.price_normal ?? med.normal_price ?? 0;

            return {
              pharmacy: pharmacyName,
              id: med.id || null,
              url: med.url || "",
              offer_price: formatPriceCLP(rawOffer),
              normal_price: formatPriceCLP(rawNormal),
              discount: med.discount ?? 0,
              name: med.name || "",
              category: categoryName,
              image: med.image || "",
              stock: med.stock ?? ""
            };
          });

          if (fechaFolder === carpetaMasReciente) {
            farmaciaDoc.categories[categoryName] ??= [];
            farmaciaDoc.categories[categoryName].push(...meds);
          }

          snapshot[categoryName] ??= [];
          snapshot[categoryName].push(
            ...meds.map((m) => ({
              id: m.id,
              name: m.name,
              offer_price: m.offer_price,
              normal_price: m.normal_price,
              discount: m.discount
            }))
          );
        }

        priceHistoryDoc.snapshots[fechaFolder] = snapshot;
      }

      await medicinesCollection.insertOne(farmaciaDoc);
      await priceHistoryCollection.updateOne(
        { pharmacy: pharmacyName },
        { $set: { snapshots: priceHistoryDoc.snapshots } },
        { upsert: true }
      );

      console.log(`✅ Procesado: ${pharmacyName}`);
    }

    console.log("✅ Todos los medicamentos fueron actualizados correctamente.");
  } catch (err) {
    console.error("❌ Error al insertar medicamentos:", err);
  } finally {
    await client.close();
    console.log("🔵 Conexión cerrada.");
  }
}

// 🏁 Ejecutar desde consola
insertMedicinesFromUpdates()
  .then(() => Deno.exit(0))
  .catch(() => Deno.exit(1));
