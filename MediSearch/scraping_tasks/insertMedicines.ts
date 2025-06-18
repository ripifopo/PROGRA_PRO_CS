/// <reference lib="deno.ns" />
// Archivo: src/lib/insertMedicines.ts

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { MongoClient } from "npm:mongodb@6.17.0";
import { normalizeCategoryName } from "../src/lib/utils/normalizeCategories.ts";

const uri = Deno.env.get("MONGODB_URI");
if (!uri) throw new Error("❌ No se encontró MONGODB_URI en las variables de entorno");

const client = new MongoClient(uri);
const db = client.db("medisearch");

const medicinesCollection = db.collection("medicines");
const priceHistoryCollection = db.collection("price_history");

const updatesPath = "./Scrapers_MediSearch/product_updates";

function transformarNombreFarmacia(nombre: string): string {
  const lower = nombre.toLowerCase();
  if (lower === "cruzverde") return "Cruz Verde";
  if (lower === "salcobrand") return "Salcobrand";
  if (lower === "ahumada") return "Farmacia Ahumada";
  return nombre;
}

function formatPriceCLP(value: any): string {
  const num = typeof value === "string" ? parseInt(value.replace(/\D/g, '')) :
              typeof value === "number" ? value : 0;
  if (!isFinite(num) || isNaN(num)) return "$0";
  return `$${num.toLocaleString("es-CL")}`;
}

// ✅ Verifica si hay al menos un JSON antes de borrar DB
async function hayArchivosJSON(): Promise<boolean> {
  for await (const pharmacyDir of Deno.readDir(updatesPath)) {
    if (!pharmacyDir.isDirectory) continue;
    const pathFarmacia = `${updatesPath}/${pharmacyDir.name}`;
    for await (const fechaDir of Deno.readDir(pathFarmacia)) {
      if (!fechaDir.isDirectory) continue;
      const fullFolderPath = `${pathFarmacia}/${fechaDir.name}`;
      for await (const archivo of Deno.readDir(fullFolderPath)) {
        if (archivo.isFile && (archivo.name.endsWith(".json") || archivo.name.endsWith(".jsonl"))) return true;
      }
    }
  }
  return false;
}

async function insertMedicinesFromUpdates() {
  try {
    console.log("✨ Conectado a la base de datos");

    const hayDatos = await hayArchivosJSON();
    if (!hayDatos) {
      console.log("❌ No se encontraron archivos JSON. Inserción cancelada.");
      return;
    }

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
          if (!archivo.isFile || (!archivo.name.endsWith(".json") && !archivo.name.endsWith(".jsonl"))) continue;

          const categoryRaw = archivo.name.replace(".json", "").replace(".jsonl", "").replace(/-/g, " ");
          const categoryName = normalizeCategoryName(categoryRaw);
          const jsonPath = `${fullFolderPath}/${archivo.name}`;

          // ✅ Lee tanto JSON como JSONL
          let productos: any[] = [];
          if (jsonPath.endsWith(".jsonl")) {
            const lines = (await Deno.readTextFile(jsonPath)).split("\n").filter(Boolean);
            productos = lines.map((line) => JSON.parse(line));
          } else {
            const rawData = await Deno.readTextFile(jsonPath);
            const parsed = JSON.parse(rawData);
            productos = Array.isArray(parsed) ? parsed : [parsed];
          }

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
            if (!farmaciaDoc.categories[categoryName]) {
              farmaciaDoc.categories[categoryName] = [];
            }
            farmaciaDoc.categories[categoryName].push(...meds);
          }

          if (!snapshot[categoryName]) snapshot[categoryName] = [];
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

insertMedicinesFromUpdates()
  .then(() => Deno.exit(0))
  .catch(() => Deno.exit(1));
