// Archivo: scraping_tasks/insertMedicines.ts

import { MongoClient } from "npm:mongodb";
import { normalizeCategoryName } from "../src/lib/utils/normalizeCategories.ts";
import "dotenv";

const uri = Deno.env.get("MONGODB_URI");
if (!uri) throw new Error("❌ No se encontró MONGODB_URI");

const client = new MongoClient(uri);
const db = client.db("medisearch");

const medicinesCollection = db.collection("medicines");
const priceHistoryCollection = db.collection("price_history");

const updatesPath = "./Scrapers_MediSearch/product_updates";

async function insertMedicinesFromUpdates() {
  try {
    console.log("✨ Conectado a la base de datos");

    for await (const pharmacyDir of Deno.readDir(updatesPath)) {
      if (!pharmacyDir.isDirectory) continue;

      const pharmacyName = transformarNombreFarmacia(pharmacyDir.name);
      const pathFarmacia = `${updatesPath}/${pharmacyDir.name}`;

      const archivos: string[] = [];
      for await (const fechaDir of Deno.readDir(pathFarmacia)) {
        if (fechaDir.isDirectory) archivos.push(fechaDir.name);
      }

      archivos.sort((a, b) => b.localeCompare(a));
      const archivoMasReciente = archivos[0];
      console.log("📁 Carpeta más reciente detectada:", archivoMasReciente);

      // 💾 Guardar backup del estado actual antes de sobrescribir
      const estadoAnterior = await medicinesCollection.findOne({ pharmacy: pharmacyName });
      const fechaAnterior = estadoAnterior?.lastUpdated;

      if (estadoAnterior && estadoAnterior.categories && fechaAnterior) {
        const snapshotExistente = await priceHistoryCollection.findOne({
          pharmacy: pharmacyName,
          [`snapshots.${fechaAnterior}`]: { $exists: true }
        });

        if (!snapshotExistente) {
          const snapshot = {};
          for (const [categoria, lista] of Object.entries(estadoAnterior.categories)) {
            snapshot[categoria] = (lista as any[]).map((m: any) => ({
              id: m.id,
              name: m.name,
              offer_price: m.offer_price,
              normal_price: m.normal_price,
              discount: m.discount,
              category: m.category
            }));
          }

          await priceHistoryCollection.updateOne(
            { pharmacy: pharmacyName },
            { $set: { [`snapshots.${fechaAnterior}`]: snapshot } },
            { upsert: true }
          );
          console.log(`📈 Guardado snapshot anterior en price_history con fecha ${fechaAnterior}`);
        } else {
          console.log(`⚠️ Ya existía snapshot para ${fechaAnterior}, no se duplicó.`);
        }
      }

      // 📦 Procesar la nueva carpeta más reciente
      const categorias: Record<string, any[]> = {};
      const fullFolderPath = `${pathFarmacia}/${archivoMasReciente}`;

      for await (const archivo of Deno.readDir(fullFolderPath)) {
        if (!archivo.isFile || !archivo.name.endsWith(".json")) continue;

        const categoryRaw = archivo.name.replace(".json", "").replace(/-/g, " ");
        const categoryName = categoryRaw.trim().toLowerCase();
        const jsonPath = `${fullFolderPath}/${archivo.name}`;

        try {
          const rawData = await Deno.readTextFile(jsonPath);
          const parsed = JSON.parse(rawData);
          const productos = Array.isArray(parsed) ? parsed : [parsed];

          categorias[categoryName] = productos.map((med) => {
            const rawOffer = med.price_offer ?? med.offer_price ?? med.offerPrice ?? med.price ?? 0;
            const rawNormal = med.price_normal ?? med.normal_price ?? med.normalPrice ?? 0;

            return {
              pharmacy: pharmacyName,
              id: med.id || null,
              url: med.url || "",
              offer_price: `$${rawOffer}`,
              normal_price: `$${rawNormal}`,
              discount: med.discount ?? 0,
              name: med.name || "",
              category: med.category || categoryName,
              image: med.image || "",
              bioequivalent: med.bioequivalent ?? "No disponible"
            };
          });

          console.log(`📄 Procesados ${productos.length} productos en categoría ${categoryName}`);
        } catch (err) {
          console.error(`❌ Error al procesar ${jsonPath}`, err);
        }
      }

      // 🟢 Actualizar medicines con nueva data y nueva fecha
      await medicinesCollection.updateOne(
        { pharmacy: pharmacyName },
        {
          $set: {
            categories: categorias,
            lastUpdated: archivoMasReciente
          }
        },
        { upsert: true }
      );

      console.log(`✅ Actualizado estado actual de ${pharmacyName} en 'medicines' con fecha ${archivoMasReciente}`);
    }

    console.log("✅ Todo fue procesado exitosamente.");
  } catch (err) {
    console.error("❌ Error general:", err);
  } finally {
    await client.close();
    console.log("🔵 Conexión cerrada.");
  }
}

function transformarNombreFarmacia(nombre: string): string {
  if (nombre.toLowerCase() === "cruzverde") return "Cruz Verde";
  if (nombre.toLowerCase() === "salcobrand") return "Salcobrand";
  if (nombre.toLowerCase() === "ahumada") return "Farmacia Ahumada";
  return nombre;
}

insertMedicinesFromUpdates()
  .then(() => Deno.exit(0))
  .catch(() => Deno.exit(1));
