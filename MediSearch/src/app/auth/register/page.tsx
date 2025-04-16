'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RegisterPage() {
  const router = useRouter();

  // Estados para almacenar los campos del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    lastname: '',
    birthday: '',
    region: '',
    weight: ''
  });

  // Manejador para actualizar los valores de los campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validaciones básicas del formulario antes de enviar
  const validateForm = () => {
    const { email, password, name, lastname, birthday, region, weight } = formData;
    if (!email || !password || !name || !lastname || !birthday || !region || !weight) {
      toast.error("Por favor completa todos los campos.");
      return false;
    }
    if (!email.includes('@')) {
      toast.error("El correo no es válido.");
      return false;
    }
    if (!region.toLowerCase().startsWith("región")) {
      toast.error("La región debe comenzar con 'Región'.");
      return false;
    }
    return true;
  };

  // Envía los datos del formulario al servidor
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Registro exitoso.");

        // Guarda temporalmente el email y password para autocompletar login
        localStorage.setItem('lastRegister', JSON.stringify({
          email: formData.email,
          password: formData.password
        }));

        // Redirige al login
        router.push('/auth/login');
      } else {
        toast.error(result.message || "Error al registrar.");
      }
    } catch (err) {
      toast.error("Error en el servidor.");
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
        <input className="form-control mb-3" name="region" placeholder="Región" value={formData.region} onChange={handleChange} />
        <input className="form-control mb-4" name="weight" type="number" placeholder="Peso (kg)" value={formData.weight} onChange={handleChange} />

        <button type="submit" className="btn btn-primary w-100">Registrarse</button>
      </form>
    </main>
  );
}
