// Archivo: src/app/auth/login/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useLoading } from '../../../context/LoadingContext.tsx';
import 'react-toastify/dist/ReactToastify.css';

export default function LoginPage() {
  const router = useRouter();
  const { setLoading } = useLoading();

  // Estado para almacenar los datos del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Al cargar la página, si existe un registro anterior, autocompleta los campos de login
  useEffect(() => {
    const last = localStorage.getItem('lastRegister');
    if (last) {
      const { email, password } = JSON.parse(last);
      setFormData({ email, password });
      localStorage.removeItem('lastRegister');
    }
  }, []);

  // Actualiza el estado del formulario a medida que el usuario escribe
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Valida que los campos del formulario sean correctos antes de enviar
  const validateForm = () => {
    const { email, password } = formData;
    if (!email || !password) {
      toast.error("Por favor completa todos los campos.");
      return false;
    }
    if (!email.includes('@')) {
      toast.error("El correo no es válido.");
      return false;
    }
    return true;
  };

  // Maneja el envío del formulario y realiza la solicitud de login al servidor
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        // Si el login es exitoso, se guarda la información en localStorage
        toast.success("Inicio de sesión exitoso.");
        localStorage.setItem('token', result.token);
        localStorage.setItem('userProfile', JSON.stringify(result.user));
        localStorage.setItem('userLocation', JSON.stringify({
          region: result.user.region,
          comuna: result.user.comuna
        }));
        router.push('/profile');
      } else {
        // Si el login falla, se muestra el mensaje de error correspondiente
        toast.error(result.message || "Credenciales incorrectas.");
      }
    } catch {
      // Manejo de errores de servidor
      toast.error("Error en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de la página de login
  return (
    <main className="min-vh-100 d-flex justify-content-center align-items-center">
      {/* Formulario de login */}
      <form onSubmit={handleSubmit} className="w-100 px-3" style={{ maxWidth: '500px' }}>
        <h2 className="text-center mb-4">Iniciar Sesión</h2>

        {/* Campo de correo electrónico */}
        <input
          className="form-control mb-3"
          name="email"
          type="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
        />

        {/* Campo de contraseña */}
        <input
          className="form-control mb-4"
          name="password"
          type="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
        />

        {/* Botón para enviar el formulario */}
        <button type="submit" className="btn w-100" style={{ backgroundColor: '#218754', color: '#fff' }}>
          Entrar
        </button>

        {/* Separador visual */}
        <div className="text-center mt-3">
          <hr />
          <span className="px-2 text-muted">O</span>
          <hr />
        </div>

        {/* Enlace para redirigir al registro de usuarios */}
        <div className="text-center mt-2">
          <a href="/auth/register" className="text-decoration-none">¿No tienes cuenta? Regístrate aquí</a>
        </div>
      </form>
    </main>
  );
}
