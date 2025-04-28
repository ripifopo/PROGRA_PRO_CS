// Archivo: src/lib/insertMedicines.ts

import { MongoClient } from "npm:mongodb";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Carga el .env
const env = await load({ envPath: "./.env" });

// Obtiene la URI de conexión
const uri = env.MONGODB_URI;
if (!uri) {
  throw new Error("No se encontró la URI de conexión a MongoDB");
}

// Conecta a MongoDB
const client = new MongoClient(uri);

// Ruta donde están los JSONs
const productJsonsLimpiosPath = "./Scrapers_MediSearch/product_jsons_limpios";

// Función principal
async function insertMedicines() {
  try {
    const db = client.db("medisearch");
    const collection = db.collection("medicines");

    console.log("🔵 Conectado a la base de datos.");

    // Borra todos los documentos anteriores
    await collection.deleteMany({});
    console.log("🧹 Base de datos de medicamentos limpiada.");

    // Lee cada carpeta de farmacia
    for await (const pharmacyFolder of Deno.readDir(productJsonsLimpiosPath)) {
      if (!pharmacyFolder.isDirectory) continue;

      const pharmacyName = pharmacyFolder.name.replace("_jsons_limpios", "");
      const pharmacyPath = `${productJsonsLimpiosPath}/${pharmacyFolder.name}`;

      // Estructura para esta farmacia
      const pharmacyDocument: any = {
        pharmacy: transformarNombreFarmacia(pharmacyName),
        categories: {},
      };

      // Lee todos los archivos de categorías
      for await (const categoryFile of Deno.readDir(pharmacyPath)) {
        if (!categoryFile.isFile || !categoryFile.name.endsWith(".json")) continue;

        const categoryName = categoryFile.name.replace(".json", "").replace(/-/g, " ");

        const filePath = `${pharmacyPath}/${categoryFile.name}`;
        const fileData = await Deno.readTextFile(filePath);
        const parsed = JSON.parse(fileData);
        const medicines = Array.isArray(parsed) ? parsed : [parsed];

        // Procesa cada medicamento
        const cleanedMedicines = medicines.map((med) => ({
          name: med.name || "",
          price: limpiarPrecio(med.offer_price),
          image: med.image || "",
          url: med.url || "",
          form: med.pharmaceutical_form || "",
          stock: med.in_stock === "Yes" ? 1 : 0,
          description: limpiarDescripcion(med.description),
        }));

        // Agrega la categoría a este documento de farmacia
        pharmacyDocument.categories[categoryName] = cleanedMedicines;
      }

      // Inserta este documento en la base de datos
      await collection.insertOne(pharmacyDocument);
      console.log(`✅ Insertados medicamentos de la farmacia: ${pharmacyDocument.pharmacy}`);
    }

    console.log("✅ Todos los medicamentos fueron insertados exitosamente.");
  } catch (error) {
    console.error("❌ Error al insertar medicamentos:", error);
  } finally {
    await client.close();
    console.log("🔵 Conexión cerrada.");
  }
}

// Función para limpiar precios
function limpiarPrecio(precio: any): string {
  if (precio == null || precio === "" || isNaN(precio)) return "$0";
  return `$${precio}`;
}

// Función para limpiar descripción
function limpiarDescripcion(desc: string | null | undefined): string {
  if (!desc || desc.toLowerCase().includes("error")) {
    return "";
  }
  return desc;
}

// Función para transformar el nombre de la farmacia
function transformarNombreFarmacia(nombre: string): string {
  if (nombre.toLowerCase() === "cruzverde") return "Cruz Verde";
  if (nombre.toLowerCase() === "salcobrand") return "Salcobrand";
  if (nombre.toLowerCase() === "ahumada") return "Farmacia Ahumada";
  return nombre;
}

// Ejecuta inmediatamente si corre el script
insertMedicines();
