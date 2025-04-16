'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RegisterPage() {
  // Estados del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    lastname: '',
    birthday: '',
    region: '',
    weight: ''
  });

  // Manejo de cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validaciones del formulario
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

  // Envío del formulario
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
        setFormData({ email: '', password: '', name: '', lastname: '', birthday: '', region: '', weight: '' });
      } else {
        toast.error(result.message || "Error al registrar.");
      }
    } catch (err) {
      toast.error("Error en el servidor.");
    }
  };

  return (
    <main className="container py-5 d-flex justify-content-center align-items-center">
      <form onSubmit={handleSubmit} className="w-100" style={{ maxWidth: '500px' }}>
        <h2 className="text-center mb-4">Registro de Usuario</h2>

        <input className="form-control mb-3" name="email" type="email" placeholder="Correo electrónico" value={formData.email} onChange={handleChange} />
        <input className="form-control mb-3" name="password" type="password" placeholder="Contraseña" value={formData.password} onChange={handleChange} />
        <input className="form-control mb-3" name="name" placeholder="Nombre" value={formData.name} onChange={handleChange} />
        <input className="form-control mb-3" name="lastname" placeholder="Apellido" value={formData.lastname} onChange={handleChange} />
        <input className="form-control mb-3" name="birthday" type="date" placeholder="Fecha de nacimiento" value={formData.birthday} onChange={handleChange} />
        <input className="form-control mb-3" name="region" placeholder="Región" value={formData.region} onChange={handleChange} />
        <input className="form-control mb-3" name="weight" type="number" placeholder="Peso (kg)" value={formData.weight} onChange={handleChange} />

        <button type="submit" className="btn btn-primary w-100">Registrarse</button>
      </form>
    </main>
  );
}
