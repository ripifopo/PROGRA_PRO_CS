// Archivo: src/app/auth/register/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useLoading } from '../../../context/LoadingContext.tsx'; // Hook del sistema de carga

export default function RegisterPage() {
  const router = useRouter();
  const { setLoading } = useLoading(); // Hook para activar y desactivar el loader

  // Estado para almacenar los datos del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    lastname: '',
    birthday: '',
    region: '',
    comuna: ''
  });

  // Este efecto intenta obtener automáticamente la región del usuario
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada por tu navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await res.json();
        const region = data.address.state || data.address.region || data.address['ISO3166-2-lvl4'] || '';
        if (region) {
          setFormData(prev => ({ ...prev, region }));
          toast.success('Región detectada automáticamente');
        }
      },
      () => toast.error('No se pudo detectar tu región'),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  // Esta función actualiza el estado cada vez que el usuario escribe
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Esta función valida todos los campos antes del envío
  const validateForm = () => {
    const { email, password, name, lastname, birthday, region, comuna } = formData;

    if (!email || !password || !name || !lastname || !birthday || !region || !comuna) {
      toast.error("Por favor completa todos los campos.");
      return false;
    }

    if (!email.includes('@')) {
      toast.error("El correo debe ser válido.");
      return false;
    }

    if (!region.toLowerCase().startsWith("región")) {
      toast.error("La región debe comenzar con 'Región'.");
      return false;
    }

    const symbolRegex = /[!@#$%^&*]/;
    if (password.length < 6 || !symbolRegex.test(password)) {
      toast.error("La contraseña debe tener al menos 6 caracteres y un símbolo especial.");
      return false;
    }

    return true;
  };

  // Esta función se ejecuta al enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true); // Activa la pantalla de carga

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Registro exitoso.");

        localStorage.setItem('lastRegister', JSON.stringify({
          email: formData.email,
          password: formData.password
        }));

        router.push('/auth/login');
      } else {
        toast.error(result.message || "Error al registrar.");
      }
    } catch {
      toast.error("Error en el servidor.");
    } finally {
      setLoading(false); // Desactiva la pantalla de carga
    }
  };

  return (
    <main className="min-vh-100 d-flex justify-content-center align-items-center">
      <form onSubmit={handleSubmit} className="w-100 px-3" style={{ maxWidth: '500px' }}>
        <h2 className="text-center mb-4">Registro de Usuario</h2>

        <input className="form-control mb-3" name="email" type="email" placeholder="Correo electrónico" value={formData.email} onChange={handleChange} />
        <input className="form-control mb-3" name="password" type="password" placeholder="Contraseña" value={formData.password} onChange={handleChange} />
        <input className="form-control mb-3" name="name" placeholder="Nombre" value={formData.name} onChange={handleChange} />
        <input className="form-control mb-3" name="lastname" placeholder="Apellido" value={formData.lastname} onChange={handleChange} />
        <input className="form-control mb-3" name="birthday" type="date" placeholder="Fecha de nacimiento" value={formData.birthday} onChange={handleChange} />
        <input className="form-control mb-3" name="comuna" placeholder="Comuna" value={formData.comuna} onChange={handleChange} />
        <input className="form-control mb-4" name="region" placeholder="Región" value={formData.region} readOnly />

        <button type="submit" className="btn w-100" style={{ backgroundColor: '#218754', color: '#fff' }}>
          Registrarse
        </button>

        <div className="text-center mt-3">
          <hr />
          <span className="px-2 text-muted">O</span>
          <hr />
        </div>

        <div className="text-center mt-2">
          <a href="/auth/login" className="text-decoration-none">¿Ya tienes cuenta? Inicia sesión</a>
        </div>
      </form>
    </main>
  );
}
