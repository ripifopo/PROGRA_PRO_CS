'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaPills, FaHeartbeat, FaStethoscope, FaEdit } from 'react-icons/fa';

// Se define la interfaz que representa los datos del perfil de usuario
interface UserProfile {
  email: string;
  name: string;
  lastname: string;
  birthday: string;
  region: string;
  icon?: string; // Campo opcional que representa el ícono del perfil
}

// Íconos disponibles para que el usuario seleccione como avatar
const availableIcons = {
  pills: <FaPills size={40} color="#218754" />,
  heartbeat: <FaHeartbeat size={40} color="#218754" />,
  stethoscope: <FaStethoscope size={40} color="#218754" />
};

export default function ProfilePage() {
  const router = useRouter();

  // Se almacenan los datos del usuario y el ícono seleccionado
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof availableIcons>('pills');
  const [showIconSelector, setShowIconSelector] = useState(false); // Controla si se despliega el selector de íconos

  // Función que calcula la edad en base a la fecha de nacimiento
  const calculateAge = (birthday: string) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Efecto que se ejecuta al cargar la página para validar sesión y cargar datos del usuario
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userProfile');
      if (!userData) throw new Error();

      const parsed = JSON.parse(userData);
      if (!parsed || typeof parsed !== 'object') throw new Error();

      // Se carga el perfil desde localStorage
      setUser(parsed);

      // Se busca el ícono guardado específicamente para el usuario
      const savedIcon = parsed.email ? localStorage.getItem(`icon-${parsed.email}`) : null;

      if (savedIcon && Object.keys(availableIcons).includes(savedIcon)) {
        setSelectedIcon(savedIcon as keyof typeof availableIcons);
      } else if (parsed.icon && Object.keys(availableIcons).includes(parsed.icon)) {
        setSelectedIcon(parsed.icon);
      }
    } catch {
      // Si ocurre un error, se considera inválida la sesión y se redirige al login
      toast.error('Sesión inválida. Inicia sesión nuevamente.');
      localStorage.removeItem('token');
      router.push('/auth/login');
    }
  }, [router]);

  // Función que cierra sesión, pero mantiene el ícono personalizado guardado por usuario
  const handleLogout = () => {
    localStorage.removeItem('token'); // Solo se elimina el token de sesión
    toast.success('Sesión cerrada');
    router.push('/auth/login');
  };

  // Función que guarda el ícono seleccionado según el email del usuario
  const handleIconChange = (icon: keyof typeof availableIcons) => {
    setSelectedIcon(icon);
    if (user?.email) {
      localStorage.setItem(`icon-${user.email}`, icon);
    }
  };

  // Si aún no se cargan los datos, no se muestra el componente
  if (!user) return null;

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-lg p-4 position-relative" style={{ maxWidth: '600px', width: '100%' }}>

        {/* Botón de cerrar sesión en la esquina superior derecha */}
        <button
          onClick={handleLogout}
          className="btn btn-sm btn-danger position-absolute"
          style={{ top: '20px', right: '20px' }}
        >
          Cerrar sesión
        </button>

        {/* Título de sección */}
        <h2 className="text-center text-success mb-3">Mi Perfil</h2>

        {/* Ícono de perfil personalizado */}
        <div className="text-center mb-3">
          <div
            className="rounded-circle bg-light d-flex justify-content-center align-items-center mx-auto"
            style={{ width: '80px', height: '80px' }}
          >
            {availableIcons[selectedIcon]}
          </div>

          {/* Botón para desplegar el menú de íconos */}
          <button
            className="btn btn-link text-success mt-1"
            onClick={() => setShowIconSelector(!showIconSelector)}
          >
            <FaEdit className="me-1" /> Editar ícono
          </button>

          {/* Selector de íconos (solo se muestra si showIconSelector está activo) */}
          {showIconSelector && (
            <div className="d-flex justify-content-center mt-2 gap-2">
              {Object.entries(availableIcons).map(([key, icon]) => (
                <button
                  key={key}
                  onClick={() => handleIconChange(key as keyof typeof availableIcons)}
                  className="btn btn-outline-success btn-sm rounded-circle"
                  style={{
                    width: '40px',
                    height: '40px',
                    padding: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del usuario (no editable) */}
        <ul className="list-group list-group-flush">
          <li className="list-group-item">
            <strong>Nombre:</strong> {user.name} {user.lastname}
          </li>
          <li className="list-group-item">
            <strong>Correo:</strong> {user.email}
          </li>
          <li className="list-group-item">
            <strong>Edad:</strong> {calculateAge(user.birthday)} años
          </li>
          <li className="list-group-item">
            <strong>Región:</strong> {user.region}
          </li>
        </ul>
      </div>
    </div>
  );
}
