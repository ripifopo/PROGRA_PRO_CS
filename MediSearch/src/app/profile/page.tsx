'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface UserProfile {
  email: string;
  name: string;
  lastname: string;
  birthday: string; // formato YYYY-MM-DD
  region: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  // Calcula edad desde la fecha de nacimiento
  const calculateAge = (birthday: string) => {
    const birthDate = new Date(birthday);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // Simula obtener datos desde el token o almacenamiento
  useEffect(() => {
    const userData = localStorage.getItem('userProfile');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      toast.error('Debes iniciar sesión para ver tu perfil');
      router.push('/auth/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    toast.success('Sesión cerrada');
    router.push('/auth/login');
  };

  if (!user) return null;

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-lg p-4" style={{ maxWidth: '600px', width: '100%' }}>
        <h2 className="text-center text-success mb-4">Mi Perfil</h2>

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

        <button onClick={handleLogout} className="btn btn-danger mt-4 w-100">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
