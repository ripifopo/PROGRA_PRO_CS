'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LoginPage() {
  const router = useRouter();

  // Estado para los campos del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Intenta precargar los datos si vienes desde registro
  useEffect(() => {
    const last = localStorage.getItem('lastRegister');
    if (last) {
      const { email, password } = JSON.parse(last);
      setFormData({ email, password });
      localStorage.removeItem('lastRegister');
    }
  }, []);

  // Actualiza los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Valida que el formulario esté completo
  const validateForm = () => {
    const { email, password } = formData;
    if (!email || !password) {
      toast.error('Por favor ingresa el correo y la contraseña.');
      return false;
    }
    if (!email.includes('@')) {
      toast.error('Correo electrónico no válido.');
      return false;
    }
    return true;
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success('Inicio de sesión exitoso.');

        // Guarda un token simulado (más adelante será JWT real)
        localStorage.setItem('token', result.token);

        // Redirige a la página de perfil
        router.push('/profile');
      } else {
        toast.error(result.message || 'Credenciales incorrectas.');
      }
    } catch (error) {
      toast.error('Error al intentar iniciar sesión.');
    }
  };

  return (
    <main className="min-vh-100 d-flex justify-content-center align-items-center">
      <form onSubmit={handleSubmit} className="w-100 px-3" style={{ maxWidth: '500px' }}>
        <h2 className="text-center mb-4">Iniciar Sesión</h2>

        <input
          className="form-control mb-3"
          name="email"
          type="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          className="form-control mb-4"
          name="password"
          type="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
        />

        <button type="submit" className="btn btn-primary w-100">
          Iniciar sesión
        </button>

        <div className="text-center mt-3">
          <hr />
          <span className="px-2 text-muted">O</span>
          <hr />
        </div>

        <div className="text-center mt-3">
          <a href="/auth/register" className="text-decoration-none">
            ¿No tienes cuenta? Regístrate aquí
          </a>
        </div>
      </form>
    </main>
  );
}
