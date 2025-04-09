'use client'; // Directiva obligatoria para que el archivo sea tratado como componente del lado del cliente

// Componente: Página de Perfil de Usuario
// Este componente permite ingresar y visualizar información personal básica,
// tratamientos activos y medicamentos frecuentes. Toda la información se guarda en localStorage.
// En futuros sprints se conectará con la base de datos real mediante login.

import { useEffect, useState } from 'react';
import { FaUserCircle, FaEdit, FaStar, FaPills } from 'react-icons/fa';

export default function ProfilePage() {
  // Estados para la información personal del usuario
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [region, setRegion] = useState('');
  const [weight, setWeight] = useState('');

  // Cálculo automático de la edad a partir de la fecha de nacimiento
  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Estados para los tratamientos y medicamentos frecuentes
  const [frequentMeds, setFrequentMeds] = useState<string[]>([]);
  const [treatments, setTreatments] = useState<
    { name: string; dosage: string; duration: string }[]
  >([]);

  // Al iniciar el componente, se cargan los datos guardados en localStorage
  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem('profile') || '{}');
    setName(profile.name || '');
    setLastname(profile.lastname || '');
    setBirthday(profile.birthday || '');
    setRegion(profile.region || '');
    setWeight(profile.weight || '');
    setFrequentMeds(profile.frequentMeds || []);
    setTreatments(profile.treatments || []);
  }, []);

  // Cada vez que cambia la información del perfil, se actualiza el localStorage
  useEffect(() => {
    localStorage.setItem(
      'profile',
      JSON.stringify({ name, lastname, birthday, region, weight, frequentMeds, treatments })
    );
  }, [name, lastname, birthday, region, weight, frequentMeds, treatments]);

  // Función para agregar un nuevo tratamiento (simulado por inputs tipo prompt)
  const addTreatment = () => {
    const newTreatment = {
      name: prompt('Nombre del medicamento') || '',
      dosage: prompt('Dosis por día') || '',
      duration: prompt('Duración del tratamiento (ej. 7 días)') || '',
    };
    if (newTreatment.name) {
      setTreatments([...treatments, newTreatment]);
    }
  };

  // Función para agregar un medicamento frecuente (simulado por input tipo prompt)
  const addFrequentMed = () => {
    const med = prompt('Nombre del medicamento frecuente');
    if (med) setFrequentMeds([...frequentMeds, med]);
  };

  return (
    <main className="container py-5">
      {/* Título de la página */}
      <h1 className="text-center mb-4 text-3xl font-bold text-primary">Mi Perfil</h1>

      {/* Sección de información personal */}
      <div className="text-center mb-5">
        <FaUserCircle size={100} className="text-secondary mb-3" />
        <div className="grid gap-3 md:grid-cols-2 max-w-xl mx-auto">
          <input className="form-control" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="form-control" placeholder="Apellido" value={lastname} onChange={(e) => setLastname(e.target.value)} />
          <input
            type="date"
            className="form-control"
            placeholder="Fecha de nacimiento"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
          {/* Mostrar la edad automáticamente al lado de la fecha */}
          {birthday && (
            <p className="text-start text-muted col-span-2">
              Edad: <strong>{calculateAge(birthday)}</strong> años
            </p>
          )}
          <input className="form-control" placeholder="Región" value={region} onChange={(e) => setRegion(e.target.value)} />
          <input className="form-control" placeholder="Peso (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
      </div>

      {/* Sección de tratamientos activos */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="text-xl font-semibold">Tratamientos activos</h2>
          <button className="btn btn-outline-primary" onClick={addTreatment}>
            <FaEdit className="me-2" /> Añadir tratamiento
          </button>
        </div>
        <ul className="list-group">
          {treatments.map((t, i) => (
            <li key={i} className="list-group-item">
              <strong>{t.name}</strong> - {t.dosage} durante {t.duration}
            </li>
          ))}
        </ul>
      </section>

      {/* Sección de medicamentos frecuentes */}
      <section>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="text-xl font-semibold">Medicamentos frecuentes</h2>
          <button className="btn btn-outline-warning" onClick={addFrequentMed}>
            <FaStar className="me-2" /> Añadir medicamento
          </button>
        </div>
        <ul className="list-group">
          {frequentMeds.map((m, i) => (
            <li key={i} className="list-group-item">
              <FaPills className="me-2 text-success" /> {m}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
