'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    const last = localStorage.getItem('lastRegister');
    if (last) {
      const { email, password } = JSON.parse(last);
      setFormData({ email, password });
      localStorage.removeItem('lastRegister');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const { email, password } = formData;

    if (!email || !password) {
      toast.error("Por favor completa los campos.");
      return false;
    }

    if (!email.includes('@')) {
      toast.error("Correo no válido.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Inicio de sesión exitoso.");
        localStorage.setItem('token', result.token);
        router.push('/profile');
      } else {
        toast.error(result.message || "Credenciales incorrectas.");
      }
    } catch {
      toast.error("Error en el servidor.");
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

        <button type="submit" className="btn w-100" style={{ backgroundColor: '#218754', color: '#fff' }}>
          Entrar
        </button>

        <div className="text-center mt-3">
          <hr />
          <span className="px-2 text-muted">O</span>
          <hr />
        </div>

        <div className="text-center mt-2">
          <a href="/auth/register" className="text-decoration-none">¿No tienes cuenta? Regístrate aquí</a>
        </div>
      </form>
    </main>
  );
}
