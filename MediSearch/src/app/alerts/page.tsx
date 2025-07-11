'use client';

import { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { XCircleFill, CheckCircleFill } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { Spinner, Button } from 'react-bootstrap';
import Link from 'next/link';

interface AlertData {
  _id: string;
  medicineId: number;
  medicineName: string;
  pharmacy: string;
  category: string;
  userEmail: string;
  medicineSlug: string;
  categorySlug: string;
  imageUrl?: string;
  createdAt: string;
  triggered?: boolean;
}

function deepDecode(text: string): string {
  let decoded = text;
  let prev;
  try {
    do {
      prev = decoded;
      decoded = decodeURIComponent(prev);
    } while (decoded !== prev);
  } catch {
    return decoded;
  }
  return decoded;
}

function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function AlertsPage() {
  const [emailVerified, setEmailVerified] = useState(false);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const user = JSON.parse(stored);
      fetch(`/api/check-verification?email=${user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.verified) {
            setEmailVerified(true);
            setShowVerifiedMessage(true);
            fetch(`/api/alerts?email=${user.email}`)
              .then(res => res.json())
              .then(setAlerts)
              .finally(() => setLoading(false));
          } else {
            setEmailVerified(false);
            setLoading(false);
          }
        })
        .catch(() => {
          setEmailVerified(false);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleVerifyEmail = async () => {
    try {
      const stored = localStorage.getItem('userProfile');
      if (!stored) return toast.error("No se encontró el usuario.");
      const user = JSON.parse(stored);
      const res = await fetch(`/api/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      res.ok
        ? toast.success('Correo de verificación enviado.')
        : toast.error('Error al enviar el correo.');
    } catch {
      toast.error('Error de red al enviar el correo.');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Alerta eliminada.');
        setAlerts(prev => prev.filter(a => a._id !== id));
      } else {
        toast.error('No se pudo eliminar la alerta.');
      }
    } catch {
      toast.error('Error al eliminar.');
    }
  };

 const handleDismissTrigger = async (id: string) => {
  try {
    await fetch('/api/alerts/disable-trigger', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    // 🔄 Actualiza el estado local
    setAlerts(prev =>
      prev.map(alert => alert._id === id ? { ...alert, triggered: false } : alert)
    );

    // 📣 Notifica a la Navbar que vuelva a revisar
    window.dispatchEvent(new Event('trigger-status-updated'));
  } catch {
    toast.error('Error al actualizar el estado de la alerta.');
  }
};


  return (
    <div className="container text-center py-5">
      <div className="mb-4">
        <FaBell size={48} color="#f1b600" />
      </div>

      <h2 className="fw-bold text-success">Tus Alertas de Precio</h2>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
        </div>
      ) : (
        <>
          {showVerifiedMessage && (
            <div className="alert alert-success fw-bold mb-4">
              ✅ Tu correo ha sido verificado correctamente.
            </div>
          )}

          {emailVerified ? (
            alerts.length === 0 ? (
              <>
                <p className="text-muted mt-2">Aún no tienes alertas activas.</p>
                <p>
                  Podrás activar notificaciones desde el{' '}
                  <a href="/comparator" className="text-success fw-bold text-decoration-none">
                    comparador de medicamentos
                  </a>.
                </p>
              </>
            ) : (
              <div className="mt-4">
                {alerts.map(alert => (
                  <div key={alert._id} className="d-flex flex-column bg-light shadow-sm rounded p-3 mb-4">
                    <div className="d-flex align-items-center justify-content-between flex-column flex-md-row gap-3">
                      <div className="d-flex align-items-center gap-3 w-100">
                        <img
                          src={alert.imageUrl || 'https://via.placeholder.com/100'}
                          alt={alert.medicineName}
                          style={{ height: '90px', width: '100px', objectFit: 'contain' }}
                        />
                        <div className="text-start w-100">
                          <h6 className="text-success fw-bold mb-1 text-uppercase">{alert.medicineName}</h6>
                          <p className="mb-0"><strong>Farmacia:</strong> {alert.pharmacy}</p>
                          <p className="mb-0">
                            <strong>Categoría:</strong> {capitalizeWords(deepDecode(alert.categorySlug))}
                          </p>

                          {alert.triggered && (
                            <div className="alert alert-success mt-2 py-2 px-3 d-flex justify-content-between align-items-center">
                              <span>💸 ¡Este medicamento bajó de precio desde tu última visita!</span>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleDismissTrigger(alert._id)}
                              >
                                <CheckCircleFill />
                              </Button>
                            </div>
                          )}

                          <div className="mt-3">
                            <Link
                              href={`/alerts/${alert.medicineId}`}
                              className="btn btn-outline-secondary btn-sm"
                            >
                              📉 Ver equivalentes
                            </Link>
                            <Link
                              href={`/comparator/categories/${encodeURIComponent(alert.categorySlug)}/${encodeURIComponent(alert.medicineId)}`}
                              className="btn btn-outline-success btn-sm ms-2"
                            >
                              🔍 Ver detalle
                            </Link>
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-link text-danger"
                        style={{ fontSize: '1.4rem' }}
                        title="Eliminar alerta"
                        onClick={() => handleDeleteAlert(alert._id)}
                      >
                        <XCircleFill />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="mb-4">
              <p className="text-danger fw-bold">Debes verificar tu correo electrónico para activar las alertas.</p>
              <button className="btn btn-outline-primary" onClick={handleVerifyEmail}>
                Verificar correo para recibir alertas
              </button>
            </div>
          )}
        </>
      )}

      <hr className="my-5" />

      <div className="mb-4">
        <h5 className="fw-bold mb-3 text-dark">¿Qué podrás activar aquí?</h5>
        <ul className="list-unstyled text-start d-inline-block">
          <li>🔔 Recibir alertas cuando un medicamento bajó de precio</li>
          <li>📉 Comparar precios entre versiones genéricas y de marca</li>
          <li>📩 Activar notificaciones visuales en esta página</li>
        </ul>
      </div>
    </div>
  );
}
