'use client';

import { useState } from 'react';
import { FaUserEdit, FaPills, FaRegClock } from 'react-icons/fa';

// Página de perfil del usuario
export default function ProfilePage() {
  // Estado que simula si el usuario ha iniciado sesión
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Datos simulados del usuario (a reemplazar por datos reales desde login o base de datos)
  const [profileData, setProfileData] = useState({
    firstName: "Tomás",
    lastName: "Poblete",
    age: 23,
    weight: 70,
    region: "Región Metropolitana",
    profileImage: "https://i.imgur.com/8Km9tLL.png" // Imagen de perfil por defecto
  });

  // Medicamentos frecuentes del usuario
  const [medications, setMedications] = useState<string[]>([
    "Paracetamol 500mg",
    "Ibuprofeno 400mg",
    "Loratadina 10mg"
  ]);

  // Recordatorios de compra o tratamiento
  const [reminders, setReminders] = useState<string[]>([
    "Comprar Paracetamol cada 30 días",
    "Recordar Ibuprofeno el viernes"
  ]);

  // Si el usuario no ha iniciado sesión, se muestra mensaje de advertencia
  if (!isLoggedIn) {
    return (
      <main className="container py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Acceso restringido</h2>
        <p>Debes iniciar sesión para acceder a tu perfil y ver tus tratamientos guardados.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8 md:px-16 text-gray-800">
      {/* Encabezado de la página con ícono */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-green-700 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">Revisa y gestiona tus datos personales y tratamientos.</p>
      </div>

      {/* Sección de información personal */}
      <section className="bg-white rounded-xl shadow p-6 mb-10 flex flex-col items-center">
        {/* Imagen de perfil centrada */}
        <div className="relative mb-4">
          <img
            src={profileData.profileImage}
            alt="Foto de perfil"
            className="w-32 h-32 rounded-full object-cover border-4 border-green-300"
          />
          <button className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow border">
            <FaUserEdit className="text-green-600" />
          </button>
        </div>

        {/* Datos del usuario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center sm:text-left">
          <p><strong>Nombre:</strong> {profileData.firstName}</p>
          <p><strong>Apellido:</strong> {profileData.lastName}</p>
          <p><strong>Edad:</strong> {profileData.age} años</p>
          <p><strong>Peso:</strong> {profileData.weight} kg</p>
          <p><strong>Región:</strong> {profileData.region}</p>
        </div>
      </section>

      {/* Medicamentos frecuentes */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaPills className="text-green-600" />
          Medicamentos frecuentes
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {medications.map((med, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-lg shadow border-l-4 border-green-400"
            >
              <p>{med}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recordatorios */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaRegClock className="text-green-600" />
          Recordatorios de compra
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {reminders.map((reminder, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-400"
            >
              <p>{reminder}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
