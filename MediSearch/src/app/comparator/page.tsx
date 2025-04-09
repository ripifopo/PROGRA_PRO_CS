'use client';

import { useState } from "react";
import { FaSearch, FaFilter, FaTag } from "react-icons/fa";

// Lista de medicamentos simulados (mock) para pruebas visuales
const mockMedicines = [
  {
    name: "Paracetamol 500mg",
    pharmacy: "Cruz Verde",
    price: 990,
    image: "https://i.imgur.com/Nz8UvBX.png",
  },
  {
    name: "Ibuprofeno 400mg",
    pharmacy: "Salcobrand",
    price: 1250,
    image: "https://i.imgur.com/J3oOXYb.png",
  },
  {
    name: "Loratadina 10mg",
    pharmacy: "Ahumada",
    price: 850,
    image: "https://i.imgur.com/IX1Tm9B.png",
  },
  {
    name: "Omeprazol 20mg",
    pharmacy: "Cruz Verde",
    price: 1350,
    image: "https://i.imgur.com/hChF4xO.png",
  },
  {
    name: "Amoxicilina 500mg",
    pharmacy: "Salcobrand",
    price: 1890,
    image: "https://i.imgur.com/dZzSukG.png",
  },
];

export default function ComparatorPage() {
  // Estado para búsqueda por texto
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para filtrar por farmacia
  const [filterPharmacy, setFilterPharmacy] = useState("");

  // Estado para ordenar resultados por precio (ascendente o descendente)
  const [sortBy, setSortBy] = useState("asc");

  // Cálculo del precio mínimo para marcar "mejor precio"
  const minPrice = Math.min(...mockMedicines.map((med) => med.price));

  // Filtrar y ordenar resultados según búsqueda, filtros y orden
  const filteredMedicines = mockMedicines
    .filter((med) =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterPharmacy ? med.pharmacy === filterPharmacy : true)
    )
    .sort((a, b) =>
      sortBy === "asc" ? a.price - b.price : b.price - a.price
    );

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8 md:px-16 text-gray-800">
      {/* Título principal */}
      <section className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-green-700">Comparador de Medicamentos</h1>
        <p className="text-gray-600">Filtra, busca y compara precios en farmacias chilenas.</p>
      </section>

      {/* Barra de búsqueda, filtro por farmacia y orden por precio */}
      <section className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
        {/* Input de búsqueda */}
        <div className="flex items-center w-full md:w-1/3 bg-white rounded-full px-4 py-2 shadow-sm">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar medicamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none bg-transparent"
          />
        </div>

        {/* Filtro por farmacia */}
        <select
          value={filterPharmacy}
          onChange={(e) => setFilterPharmacy(e.target.value)}
          className="px-4 py-2 rounded-full border shadow-sm bg-white"
        >
          <option value="">Todas las farmacias</option>
          <option value="Cruz Verde">Cruz Verde</option>
          <option value="Salcobrand">Salcobrand</option>
          <option value="Ahumada">Ahumada</option>
        </select>

        {/* Orden por precio */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-full border shadow-sm bg-white"
        >
          <option value="asc">Menor precio</option>
          <option value="desc">Mayor precio</option>
        </select>
      </section>

      {/* Resultado si hay filtros activos */}
      {(filterPharmacy || searchTerm) && (
        <p className="text-center text-sm text-gray-500 mb-6">
          Resultados filtrados: <strong>{filteredMedicines.length}</strong> coincidencias encontradas.
        </p>
      )}

      {/* Tarjetas de resultados */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMedicines.length === 0 ? (
          <p className="text-center col-span-3 text-gray-500">
            No se encontraron medicamentos con los filtros aplicados.
          </p>
        ) : (
          filteredMedicines.map((med, index) => (
            <div
              key={index}
              className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition flex flex-col sm:flex-row items-center gap-4"
            >
              {/* Imagen del medicamento */}
              <img
                src={med.image}
                alt={med.name}
                className="w-24 h-24 object-contain"
              />

              {/* Información del medicamento */}
              <div className="text-center sm:text-left">
                <h2 className="text-lg font-bold text-green-700">{med.name}</h2>
                <p className="text-sm text-gray-500">{med.pharmacy}</p>
                <p className="text-lg text-gray-800 font-semibold">${med.price}</p>

                {/* Etiqueta si es el más barato */}
                {med.price === minPrice && (
                  <span className="inline-flex items-center mt-2 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    <FaTag className="mr-1" /> Mejor precio
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
