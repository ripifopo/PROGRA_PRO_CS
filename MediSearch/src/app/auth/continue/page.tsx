'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Button, Card } from 'react-bootstrap';
import { useEffect, useState, Suspense } from 'react';
import { FaUserPlus, FaSignInAlt } from 'react-icons/fa';

export default function ContinueAuthPage() {
  return (
    <Suspense fallback={<div className="text-center my-5">Cargando...</div>}>
      <ContinueHandler />
    </Suspense>
  );
}

function ContinueHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) setRedirectTo(redirect);
  }, [searchParams]);

  const handleGoToLogin = () => {
    if (redirectTo) {
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`);
    } else {
      router.push('/auth/login');
    }
  };

  const handleGoToRegister = () => {
    if (redirectTo) {
      router.push(`/auth/register?redirect=${encodeURIComponent(redirectTo)}`);
    } else {
      router.push('/auth/register');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-white">
      <div className="shadow-lg rounded-4 p-5 text-center" style={{ maxWidth: '520px', width: '100%' }}>
        <div className="mb-4">
          <div
            className="bg-success bg-opacity-10 rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3"
            style={{ width: '70px', height: '70px' }}
          >
            <FaUserPlus size={32} className="text-success" />
          </div>
          <h3 className="fw-bold text-success">¡Guarda tu medicamento frecuente!</h3>
          <p className="text-muted mt-2">
            Para guardar este medicamento, inicia sesión o crea una cuenta en MediSearch.
          </p>
        </div>

        <div className="d-grid gap-3">
          <Button
            size="lg"
            variant="outline-success"
            className="d-flex align-items-center justify-content-center gap-2 py-2"
            onClick={handleGoToLogin}
          >
            <FaSignInAlt /> Iniciar sesión
          </Button>

          <Button
            size="lg"
            variant="success"
            className="d-flex align-items-center justify-content-center gap-2 py-2"
            onClick={handleGoToRegister}
          >
            <FaUserPlus /> Crear cuenta
          </Button>
        </div>
      </div>
    </div>
  );
}
