// Archivo: src/lib/insertMedicines.ts

import { MongoClient } from "npm:mongodb";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Carga las variables del archivo .env
const env = await load({ envPath: "./.env" });

// Obtiene la URI de conexión a MongoDB
const uri = env.MONGODB_URI;

if (!uri) {
  throw new Error("No se encontró la URI de conexión a MongoDB");
}

// Crea el cliente de MongoDB
const client = new MongoClient(uri);

// Ruta donde están los productos limpios
const productJsonsLimpiosPath = "./Scrapers_MediSearch/product_jsons_limpios";

// Función que limpia el nombre de un medicamento (ej: "Kotol 20mg, 30 comprimidos" → "Kotol")
function cleanMedicineName(name: string): string {
  const clean = name.split(/(\d+mg|\d+ml|\d+g|\d+mcg)/i)[0].trim();
  return clean.replace(/,/g, "").trim();
}

// Función que limpia el precio (ej: 2490 → "$ 2.490")
function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseInt(price.replace(/[^\d]/g, ""), 10) : price;
  return `$ ${num.toLocaleString("es-CL")}`;
}

// Función principal para insertar medicamentos agrupados por farmacia y categoría
async function insertMedicines() {
  try {
    const db = client.db("medisearch");
    const collection = db.collection("medicines");

    console.log("🔵 Conectado a la base de datos");

    // Elimina todos los medicamentos antiguos
    await collection.deleteMany({});
    console.log("🧹 Medicamentos anteriores eliminados");

    const medicinesByPharmacy: Record<string, any> = {};

    // Lee las carpetas de farmacias
    for await (const pharmacyFolder of Deno.readDir(productJsonsLimpiosPath)) {
      if (!pharmacyFolder.isDirectory) continue;

      let pharmacyName = pharmacyFolder.name.replace("_jsons_limpios", "");

      // Normaliza nombres de farmacia
      if (pharmacyName.toLowerCase() === "ahumada") pharmacyName = "Farmacia Ahumada";
      if (pharmacyName.toLowerCase() === "cruzverde") pharmacyName = "Cruz Verde";
      if (pharmacyName.toLowerCase() === "salcobrand") pharmacyName = "Salcobrand";

      const pharmacyPath = `${productJsonsLimpiosPath}/${pharmacyFolder.name}`;

      // Inicializa estructura para la farmacia
      if (!medicinesByPharmacy[pharmacyName]) {
        medicinesByPharmacy[pharmacyName] = { pharmacy: pharmacyName, categories: {} };
      }

      // Lee todas las categorías
      for await (const file of Deno.readDir(pharmacyPath)) {
        if (!file.isFile || !file.name.endsWith(".json")) continue;

        const filePath = `${pharmacyPath}/${file.name}`;
        const fileData = await Deno.readTextFile(filePath);
        const parsed = JSON.parse(fileData);

        const categoryName = file.name.replace(".json", ""); // Nombre de la categoría

        const medicines = Array.isArray(parsed) ? parsed : [parsed];

        medicinesByPharmacy[pharmacyName].categories[categoryName] = medicines.map((med: any) => ({
          name: cleanMedicineName(med.name || ""),
          price: formatPrice(med.price || 0),
          image: med.image || "",
          url: med.url || "",
          form: med.form || "",
          stock: med.stock || 0,
          description: med.description || "",
        }));
      }
    }

    // Inserta la estructura final en la base de datos
    const documents = Object.values(medicinesByPharmacy);
    await collection.insertMany(documents);

    console.log("✅ Medicamentos organizados por farmacia y categoría insertados exitosamente.");
  } catch (error) {
    console.error("❌ Error al insertar medicamentos:", error);
  } finally {
    await client.close();
    console.log("🔵 Conexión cerrada");
  }
}

// Ejecuta la función automáticamente
insertMedicines();
