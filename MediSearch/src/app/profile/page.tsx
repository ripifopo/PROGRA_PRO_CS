// Archivo: src/app/profile/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaPills, FaHeartbeat, FaStethoscope, FaEdit } from 'react-icons/fa';
import { useLoading } from '../../../context/LoadingContext';

// Interfaz para representar el perfil del usuario
interface UserProfile {
  email: string;
  name: string;
  lastname: string;
  birthday: string;
  region: string;
  icon?: string;
}

// Íconos disponibles para el perfil
const availableIcons = {
  pills: <FaPills size={40} color="#218754" />,
  heartbeat: <FaHeartbeat size={40} color="#218754" />,
  stethoscope: <FaStethoscope size={40} color="#218754" />,
};

export default function ProfilePage() {
  const router = useRouter();
  const { setLoading } = useLoading();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof availableIcons>('pills');
  const [showIconSelector, setShowIconSelector] = useState(false);

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
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('userProfile');
      if (!token || !userData) throw new Error();
      const parsed = JSON.parse(userData);
      if (!parsed || typeof parsed !== 'object') throw new Error();
      setUser(parsed);
      const savedIcon = parsed.email ? localStorage.getItem(`icon-${parsed.email}`) : null;
      if (savedIcon && Object.keys(availableIcons).includes(savedIcon)) {
        setSelectedIcon(savedIcon as keyof typeof availableIcons);
      } else if (parsed.icon && Object.keys(availableIcons).includes(parsed.icon)) {
        setSelectedIcon(parsed.icon);
      }
    } catch {
      toast.error('Sesión inválida. Inicia sesión nuevamente.');
      localStorage.removeItem('token');
      localStorage.removeItem('userProfile');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router, setLoading]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    toast.success('Sesión cerrada');
    router.push('/auth/login');
  };

  const handleIconChange = (icon: keyof typeof availableIcons) => {
    setSelectedIcon(icon);
    if (user?.email) {
      localStorage.setItem(`icon-${user.email}`, icon);
    }
  };

  if (!user) return null;

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-lg p-4 position-relative" style={{ maxWidth: '600px', width: '100%' }}>
        <button
          onClick={handleLogout}
          className="btn btn-sm btn-danger position-absolute"
          style={{ top: '20px', right: '20px' }}
        >
          Cerrar sesión
        </button>

        <h2 className="text-center text-success mb-3">Mi Perfil</h2>

        <div className="text-center mb-3">
          <div
            className="rounded-circle bg-light d-flex justify-content-center align-items-center mx-auto"
            style={{ width: '80px', height: '80px' }}
          >
            {availableIcons[selectedIcon]}
          </div>

          <button
            className="btn btn-link text-success mt-1"
            onClick={() => setShowIconSelector(!showIconSelector)}
          >
            <FaEdit className="me-1" /> Editar ícono
          </button>

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
