'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaPills, FaHeartbeat, FaStethoscope, FaEdit } from 'react-icons/fa';

// Interfaz para representar el perfil del usuario
interface UserProfile {
  email: string;
  name: string;
  lastname: string;
  birthday: string;
  region: string;
  icon?: string; // Icono de perfil personalizado (opcional)
}

// Íconos disponibles para el perfil
const availableIcons = {
  pills: <FaPills size={40} color="#218754" />,
  heartbeat: <FaHeartbeat size={40} color="#218754" />,
  stethoscope: <FaStethoscope size={40} color="#218754" />,
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof availableIcons>('pills');
  const [showIconSelector, setShowIconSelector] = useState(false); // Muestra u oculta el menú de íconos

  // Calcula la edad a partir de la fecha de nacimiento
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

  // Carga datos desde localStorage y verifica autenticación
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('userProfile');

      // Si no hay token o perfil, se considera sesión inválida
      if (!token || !userData) {
        throw new Error();
      }

      const parsed = JSON.parse(userData);
      if (!parsed || typeof parsed !== 'object') throw new Error();

      setUser(parsed);

      // Verifica si hay ícono personalizado guardado por email
      const savedIcon = parsed.email ? localStorage.getItem(`icon-${parsed.email}`) : null;
      if (savedIcon && Object.keys(availableIcons).includes(savedIcon)) {
        setSelectedIcon(savedIcon as keyof typeof availableIcons);
      } else if (parsed.icon && Object.keys(availableIcons).includes(parsed.icon)) {
        setSelectedIcon(parsed.icon);
      }
    } catch {
      // Si algo falla, limpia la sesión y redirige
      toast.error('Sesión inválida. Inicia sesión nuevamente.');
      localStorage.removeItem('token');
      localStorage.removeItem('userProfile');
      router.push('/auth/login');
    }
  }, [router]);

  // Cierra sesión, eliminando el token y redirigiendo (pero manteniendo íconos por usuario)
  const handleLogout = () => {
    localStorage.removeItem('token');       // Elimina token
    localStorage.removeItem('userProfile'); // Elimina perfil cargado
    toast.success('Sesión cerrada');
    router.push('/auth/login');
  };

  // Cambia el ícono de perfil y lo guarda asociado al email
  const handleIconChange = (icon: keyof typeof availableIcons) => {
    setSelectedIcon(icon);
    if (user?.email) {
      localStorage.setItem(`icon-${user.email}`, icon); // Guardado personalizado por usuario
    }
  };

  // Mientras no haya usuario cargado, no renderizar nada
  if (!user) return null;

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-lg p-4 position-relative" style={{ maxWidth: '600px', width: '100%' }}>

        {/* Botón de cerrar sesión arriba a la derecha */}
        <button
          onClick={handleLogout}
          className="btn btn-sm btn-danger position-absolute"
          style={{ top: '20px', right: '20px' }}
        >
          Cerrar sesión
        </button>

        {/* Título principal */}
        <h2 className="text-center text-success mb-3">Mi Perfil</h2>

        {/* Ícono personalizado del perfil */}
        <div className="text-center mb-3">
          <div
            className="rounded-circle bg-light d-flex justify-content-center align-items-center mx-auto"
            style={{ width: '80px', height: '80px' }}
          >
            {availableIcons[selectedIcon]}
          </div>

          {/* Botón para desplegar selector de íconos */}
          <button
            className="btn btn-link text-success mt-1"
            onClick={() => setShowIconSelector(!showIconSelector)}
          >
            <FaEdit className="me-1" /> Editar ícono
          </button>

          {/* Opciones de íconos (solo si showIconSelector está activado) */}
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

        {/* Datos del perfil del usuario (no editables) */}
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
