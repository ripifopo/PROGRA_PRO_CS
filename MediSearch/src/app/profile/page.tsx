// Archivo: src/app/profile/page.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaPills, FaHeartbeat, FaStethoscope, FaEdit } from 'react-icons/fa';
import { XCircleFill } from 'react-bootstrap-icons';

import { useLoading } from '../../context/LoadingContext.tsx';
import { useAuth } from '../../context/AuthContext'; // Contexto global de sesión

// Tipo de datos del usuario
interface UserProfile {
  email: string;
  name: string;
  lastname: string;
  birthday: string;
  region: string;
  icon?: string;
}

// Tipo de medicamentos frecuentes
interface FrequentMedicine {
  _id: string;
  userEmail: string;
  medicineName: string;
  pharmacy: string;
  category: string;
  imageUrl?: string;
  pharmacyUrl?: string;
  savedAt: string;
}

// Íconos disponibles para el usuario
const availableIcons = {
  pills: <FaPills size={40} color="#218754" />,
  heartbeat: <FaHeartbeat size={40} color="#218754" />,
  stethoscope: <FaStethoscope size={40} color="#218754" />,
};

export default function ProfilePage() {
  const router = useRouter();
  const { isLoading, setLoading } = useLoading();
  const { logout } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof availableIcons>('pills');
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [frequentList, setFrequentList] = useState<FrequentMedicine[]>([]);

  const alreadyErrored = useRef(false); // 🧠 Esto evita múltiples toasts

  // Cargar perfil del usuario y medicamentos frecuentes
  useEffect(() => {
    setLoading(true);

    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userProfile');
        if (!token || !userData) throw new Error();

        const parsed = JSON.parse(userData);
        setUser(parsed);

        const savedIcon = parsed.email ? localStorage.getItem(`icon-${parsed.email}`) : null;
        if (savedIcon && Object.keys(availableIcons).includes(savedIcon)) {
          setSelectedIcon(savedIcon as keyof typeof availableIcons);
        } else if (parsed.icon && Object.keys(availableIcons).includes(parsed.icon)) {
          setSelectedIcon(parsed.icon);
        }

        const res = await fetch(`/api/frequent?email=${parsed.email}`);
        const data = await res.json();
        setFrequentList(data);
      } catch {
        if (!alreadyErrored.current) {
          alreadyErrored.current = true;

          if (!sessionStorage.getItem('logoutByUser')) {
            toast.error('Sesión inválida. Inicia sesión nuevamente.');
          } else {
            sessionStorage.removeItem('logoutByUser');
          }

          localStorage.removeItem('token');
          localStorage.removeItem('userProfile');
          logout();
          router.push('/auth/login');
        }
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };

    loadData();
  }, [router, setLoading, logout]);

  // Calcular edad del usuario
  const calculateAge = (birthday: string) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // Cerrar sesión
  const handleLogout = () => {
    sessionStorage.setItem('logoutByUser', '1'); // Marca que fue logout manual
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    logout(); // Notifica al contexto global
    toast.success('Sesión cerrada');
    router.push('/auth/login');
  };

  // Cambiar ícono de perfil
  const handleIconChange = (icon: keyof typeof availableIcons) => {
    setSelectedIcon(icon);
    if (user?.email) {
      localStorage.setItem(`icon-${user.email}`, icon);
    }
  };

  // Capitalizar categorías
  const capitalizeCategory = (text: string) => {
    return decodeURIComponent(text)
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Eliminar medicamento frecuente
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/frequent?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Medicamento eliminado');
        setFrequentList(prev => prev.filter(m => m._id !== id));
      } else {
        toast.error('Error al eliminar medicamento');
      }
    } catch {
      toast.error('Error al eliminar medicamento');
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="container py-5">
      <div className="card shadow-lg p-4 position-relative mx-auto" style={{ maxWidth: '600px' }}>
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
                  style={{ width: '40px', height: '40px' }}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
        </div>

        <ul className="list-group list-group-flush">
          <li className="list-group-item"><strong>Nombre:</strong> {user.name} {user.lastname}</li>
          <li className="list-group-item"><strong>Correo:</strong> {user.email}</li>
          <li className="list-group-item"><strong>Edad:</strong> {calculateAge(user.birthday)} años</li>
          <li className="list-group-item"><strong>Región:</strong> {user.region}</li>
        </ul>
      </div>

      {frequentList.length > 0 && (
        <div className="mt-5">
          <h3 className="text-center my-5 fw-bold text-dark" style={{ fontSize: '1.8rem', letterSpacing: '0.5px' }}>
            🩺 Tus Medicamentos Frecuentes
          </h3>

          {frequentList.map((med) => (
            <div
              key={med._id}
              className="d-flex align-items-center justify-content-between bg-light shadow-sm rounded p-3 mb-3"
            >
              <div className="d-flex align-items-center gap-3">
                <img
                  src={med.imageUrl || 'https://via.placeholder.com/100'}
                  alt={med.medicineName}
                  style={{ height: '90px', width: '100px', objectFit: 'contain' }}
                />
                <div>
                  <h6 className="text-success fw-bold mb-1 text-uppercase">{med.medicineName}</h6>
                  <p className="mb-0"><strong>Farmacia:</strong> {med.pharmacy}</p>
                  <p className="mb-0"><strong>Categoría:</strong> {capitalizeCategory(med.category)}</p>
                </div>
              </div>
              <button
                className="btn btn-link text-danger"
                style={{ fontSize: '1.4rem' }}
                title="Eliminar medicamento"
                onClick={() => handleDelete(med._id)}
              >
                <XCircleFill />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
