'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Button, Card } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { FaUserPlus, FaSignInAlt } from 'react-icons/fa';

export default function ContinueAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Almacena la ruta a la que se quiere volver después de autenticar
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) setRedirectTo(redirect);
  }, [searchParams]);

  // Redirige a la página de login con el redirect incluido
  const handleGoToLogin = () => {
    if (redirectTo) {
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`);
    } else {
      router.push('/auth/login');
    }
  };

  // Redirige a la página de registro con el redirect incluido
  const handleGoToRegister = () => {
    if (redirectTo) {
      router.push(`/auth/register?redirect=${encodeURIComponent(redirectTo)}`);
    } else {
      router.push('/auth/register');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <Card className="p-5 shadow-lg border-0" style={{ maxWidth: '500px', width: '100%' }}>
        <h3 className="text-center text-success fw-bold mb-3">
          ¡Guarda tu medicamento frecuente!
        </h3>
        <p className="text-center text-muted mb-4">
          Para guardar este medicamento, inicia sesión o crea una cuenta.
        </p>

        <div className="d-grid gap-3">
          <Button
            variant="success"
            className="d-flex align-items-center justify-content-center gap-2"
            onClick={handleGoToLogin}
          >
            <FaSignInAlt /> Iniciar sesión
          </Button>

          <Button
            variant="outline-secondary"
            className="d-flex align-items-center justify-content-center gap-2"
            onClick={handleGoToRegister}
          >
            <FaUserPlus /> Crear cuenta
          </Button>
        </div>
      </Card>
    </Container>
  );
}
