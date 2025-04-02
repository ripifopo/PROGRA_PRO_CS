// Archivo: app/comparator/page.tsx

import fs from "fs/promises";
import path from "path";
import { FaPills, FaFilter } from "react-icons/fa";
import { MdSearch } from "react-icons/md";

// Este componente se ejecuta del lado del servidor
export default async function ComparatorPage() {
  // Ruta al archivo JSON
  const filePath = path.resolve(process.cwd(), "WebScrapers/output/medicines.json");

  // Leer el archivo y parsear su contenido
  let medicines = [];
  try {
    const fileData = await fs.readFile(filePath, "utf8");
    medicines = JSON.parse(fileData);
  } catch (error) {
    console.error("❌ Error al leer el archivo medicines.json:", error);
  }

  return (
    <main className="container mx-auto py-8 px-4">
      {/* Título */}
      <section className="text-center mb-10">
        <h1 className="text-4xl font-bold text-green-700 flex justify-center items-center gap-2">
          <FaPills />
          Comparador de Medicamentos
        </h1>
        <p className="text-gray-600 mt-3">
          Compara precios de medicamentos y encuentra disponibilidad en farmacias cercanas.
        </p>
      </section>

      {/* Filtros */}
      <section className="mb-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-1/2">
            <MdSearch className="text-green-700 text-xl" />
            <input
              type="text"
              placeholder="Buscar medicamento..."
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-1/2">
            <FaFilter className="text-green-700 text-xl" />
            <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
              <option>Seleccionar región</option>
              <option>RM</option>
              <option>Valparaíso</option>
              <option>Biobío</option>
              <option>Otras regiones...</option>
            </select>
          </div>
        </div>
      </section>

      {/* Lista de medicamentos */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {medicines.length === 0 ? (
          <p className="text-gray-500 text-center col-span-2">
            No se encontraron resultados. Revisa si hay datos en el archivo JSON.
          </p>
        ) : (
          medicines.map((med: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-300"
            >
              <div>
                <h3 className="text-lg font-semibold text-green-700">{med.name}</h3>
                <p className="text-sm text-gray-500">Farmacia: {med.pharmacy}</p>
                <p className="text-sm text-gray-500">Precio: ${med.price}</p>
              </div>
              <div>
                <img
                  src={med.image || "/pills.svg"}
                  alt={med.name}
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
