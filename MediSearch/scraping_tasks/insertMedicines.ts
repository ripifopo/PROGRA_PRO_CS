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
    console.log("✨ Conectado a MongoDB");

    for await (const pharmacyDir of Deno.readDir(updatesPath)) {
      if (!pharmacyDir.isDirectory) continue;

      const pharmacyName = transformarNombreFarmacia(pharmacyDir.name);
      const pathFarmacia = `${updatesPath}/${pharmacyDir.name}`;

      // Obtener carpetas con fechas
      const fechas: string[] = [];
      for await (const carpeta of Deno.readDir(pathFarmacia)) {
        if (carpeta.isDirectory) fechas.push(carpeta.name);
      }

      if (fechas.length === 0) {
        console.warn(`⚠️ No se encontraron carpetas con fechas para ${pharmacyName}`);
        continue;
      }

      fechas.sort((a, b) => b.localeCompare(a));
      const nuevaFecha = fechas[0];
      const nuevaRuta = `${pathFarmacia}/${nuevaFecha}`;

      console.log(`📁 ${pharmacyName}: usando carpeta más reciente → ${nuevaFecha}`);

      // Obtener el estado anterior de medicines (antes de sobrescribir)
      const estadoAnterior = await medicinesCollection.findOne({ pharmacy: pharmacyName });
      const fechaAnterior = estadoAnterior?.lastUpdated;

      // Si existe una versión anterior y no ha sido guardada como snapshot
      if (estadoAnterior && estadoAnterior.categories && fechaAnterior) {
        const snapshotYaExiste = await priceHistoryCollection.findOne({
          pharmacy: pharmacyName,
          [`snapshots.${fechaAnterior}`]: { $exists: true }
        });

        if (!snapshotYaExiste) {
          const snapshot = {};
          for (const [cat, lista] of Object.entries(estadoAnterior.categories)) {
            snapshot[cat] = (lista as any[]).map((m: any) => ({
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

          console.log(`📈 Snapshot guardado para ${pharmacyName} con fecha ${fechaAnterior}`);
        } else {
          console.log(`⏭️ Snapshot ${fechaAnterior} ya existe para ${pharmacyName}, se omite.`);
        }
      }

      // Procesar medicamentos nuevos desde la carpeta más reciente
      const categorias: Record<string, any[]> = {};

      for await (const archivo of Deno.readDir(nuevaRuta)) {
        if (!archivo.isFile || !archivo.name.endsWith(".json")) continue;

        const nombreCategoria = archivo.name.replace(".json", "").replace(/-/g, " ").trim().toLowerCase();
        const rutaJson = `${nuevaRuta}/${archivo.name}`;

        try {
          const raw = await Deno.readTextFile(rutaJson);
          const parsed = JSON.parse(raw);
          const productos = Array.isArray(parsed) ? parsed : [parsed];

          categorias[nombreCategoria] = productos.map((med) => {
            const rawOffer = med.price_offer ?? med.offer_price ?? med.offerPrice ?? med.price ?? 0;
            const rawNormal = med.price_normal ?? med.normal_price ?? med.normalPrice ?? 0;

            return {
              pharmacy: pharmacyName,
              id: med.id || null,
              name: med.name || "",
              offer_price: `$${rawOffer}`,
              normal_price: `$${rawNormal}`,
              discount: med.discount ?? 0,
              url: med.url || "",
              image: med.image || "",
              category: med.category || nombreCategoria,
              bioequivalent: med.bioequivalent ?? "No disponible"
            };
          });

          console.log(`📄 ${nombreCategoria}: ${productos.length} productos procesados`);
        } catch (err) {
          console.error(`❌ Error procesando ${rutaJson}:`, err.message);
        }
      }

      // Actualizar documento actual de medicines
      await medicinesCollection.updateOne(
        { pharmacy: pharmacyName },
        {
          $set: {
            categories: categorias,
            lastUpdated: nuevaFecha
          }
        },
        { upsert: true }
      );

      console.log(`✅ Estado actual actualizado para ${pharmacyName} con fecha ${nuevaFecha}`);
    }

    console.log("🎉 Todo se procesó sin errores.");
  } catch (err) {
    console.error("💥 Error crítico:", err);
  } finally {
    await client.close();
    console.log("🔒 Conexión cerrada.");
  }
}

function transformarNombreFarmacia(nombre: string): string {
  const lower = nombre.toLowerCase();
  if (lower === "cruzverde") return "Cruz Verde";
  if (lower === "salcobrand") return "Salcobrand";
  if (lower === "ahumada") return "Farmacia Ahumada";
  return nombre;
}

insertMedicinesFromUpdates()
  .then(() => Deno.exit(0))
  .catch(() => Deno.exit(1));
