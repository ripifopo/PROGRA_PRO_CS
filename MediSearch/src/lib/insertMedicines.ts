// Archivo: src/lib/insertMedicines.ts

import { MongoClient } from "npm:mongodb";
import { normalizeCategoryName } from "./utils/normalizeCategories.ts";

// ✅ Carga la URI desde el archivo .env (pasado por --env al ejecutar)
const uri = Deno.env.get("MONGODB_URI");
if (!uri) throw new Error("❌ No se encontró MONGODB_URI en las variables de entorno");

const client = new MongoClient(uri);
const db = client.db("medisearch");

// Colecciones utilizadas
const medicinesCollection = db.collection("medicines");
const priceHistoryCollection = db.collection("price_history");

// 📁 Ruta donde están almacenados los scrapeos por farmacia y fecha
const updatesPath = "./Scrapers_MediSearch/product_updates";

// 🔧 Función auxiliar para transformar nombres de farmacias
function transformarNombreFarmacia(nombre: string): string {
  const lower = nombre.toLowerCase();
  if (lower === "cruzverde") return "Cruz Verde";
  if (lower === "salcobrand") return "Salcobrand";
  if (lower === "ahumada") return "Farmacia Ahumada";
  return nombre;
}

// 🔧 Formateo seguro de precios a CLP (acepta número o string)
function formatPriceCLP(value: any): string {
  const num = typeof value === "string" ? parseInt(value.replace(/\D/g, '')) :
              typeof value === "number" ? value : 0;
  if (!isFinite(num) || isNaN(num)) return "$0";
  return `$${num.toLocaleString("es-CL")}`;
}

// 🧠 Función principal
async function insertMedicinesFromUpdates() {
  try {
    console.log("✨ Conectado a la base de datos");

    // 🧹 Limpia la colección de medicamentos (reemplazo completo)
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

      fechasDisponibles.sort((a, b) => b.localeCompare(a)); // orden descendente
      const carpetaMasReciente = fechasDisponibles[0];

      // Documento de farmacia para colección `medicines`
      const farmaciaDoc: any = {
        pharmacy: pharmacyName,
        categories: {}
      };

      // Carga del historial previo si existe
      const historialPrevio = await priceHistoryCollection.findOne({ pharmacy: pharmacyName });
      const priceHistoryDoc: any = {
        pharmacy: pharmacyName,
        snapshots: historialPrevio?.snapshots || {}
      };

      // Recorre cada carpeta de fecha
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
            // 🔍 Detecta distintos nombres para las claves de precios
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

          // 📌 Solo agrega el scrapeo más reciente a `medicines`
          if (fechaFolder === carpetaMasReciente) {
            if (!farmaciaDoc.categories[categoryName]) {
              farmaciaDoc.categories[categoryName] = [];
            }
            farmaciaDoc.categories[categoryName].push(...meds);
          }

          // 📅 Agrega snapshot para cada fecha (o sobreescribe si ya existía)
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

        // 🕓 Almacena el snapshot bajo su fecha (puede sobrescribir esa fecha)
        priceHistoryDoc.snapshots[fechaFolder] = snapshot;
      }

      // Inserta la farmacia en `medicines`
      await medicinesCollection.insertOne(farmaciaDoc);

      // Elimina y reemplaza el historial completo por uno actualizado (con fechas anteriores + nueva)
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

// 🏁 Ejecuta si se llama directamente como script
insertMedicinesFromUpdates()
  .then(() => Deno.exit(0))
  .catch(() => Deno.exit(1));
