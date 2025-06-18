// Archivo: src/lib/insertMedicines.ts

import { MongoClient } from "npm:mongodb";
import { normalizeCategoryName } from "../src/lib/utils/normalizeCategories.ts";
import "dotenv"; // Carga .env automáticamente desde deno.json

const uri = Deno.env.get("MONGODB_URI");
if (!uri) throw new Error("❌ No se encontró MONGODB_URI");


const client = new MongoClient(uri);
const db = client.db("medisearch");

const medicinesCollection = db.collection("medicines");
const priceHistoryCollection = db.collection("price_history");

// Ruta de los scrapeos por farmacia y fecha
const updatesPath = "./Scrapers_MediSearch/product_updates";

// Función principal
async function insertMedicinesFromUpdates() {
  try {
    console.log("✨ Conectado a la base de datos");

    await medicinesCollection.deleteMany({});
    console.log("🧹 Colección de medicamentos reiniciada");

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

      const farmaciaDoc: any = {
        pharmacy: pharmacyName,
        categories: {}
      };

      const priceHistoryDoc: any = {
        pharmacy: pharmacyName,
        snapshots: {}
      };

      for (const fechaFolder of archivos) {
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

          const meds = productos.map((med) => ({
            pharmacy: pharmacyName,
            id: med.id || null,
            url: med.url || "",
            offer_price: `$${med.price_offer ?? 0}`,
            normal_price: `$${med.price_normal ?? 0}`,
            discount: med.discount ?? 0,
            name: med.name || "",
            category: categoryName,
            image: med.image || "",
            stock: med.stock ?? ""
          }));

          // Guardar en medicines solo el scrapeo más reciente
          if (fechaFolder === archivoMasReciente) {
            if (!farmaciaDoc.categories[categoryName]) {
              farmaciaDoc.categories[categoryName] = [];
            }
            farmaciaDoc.categories[categoryName].push(...meds);
          }

          // Guardar todos los scrapeos en price_history (compacto)
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

      // Inserción final en la base de datos
      await medicinesCollection.insertOne(farmaciaDoc);
      await priceHistoryCollection.insertOne(priceHistoryDoc);

      console.log(`✅ Procesado: ${pharmacyName}`);
    }

    console.log("✅ Todos los medicamentos fueron actualizados correctamente.");
  } catch (err) {
    console.error("❌ Error al insertar desde product_updates:", err);
  } finally {
    await client.close();
    console.log("🔵 Conexión cerrada.");
  }
}

// Utilidad para nombrar farmacias con formato legible
function transformarNombreFarmacia(nombre: string): string {
  if (nombre.toLowerCase() === "cruzverde") return "Cruz Verde";
  if (nombre.toLowerCase() === "salcobrand") return "Salcobrand";
  if (nombre.toLowerCase() === "ahumada") return "Farmacia Ahumada";
  return nombre;
}

// Ejecutar si corre directo
insertMedicinesFromUpdates()
  .then(() => Deno.exit(0))
  .catch(() => Deno.exit(1));