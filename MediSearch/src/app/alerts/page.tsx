'use client';

import { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { XCircleFill } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { Card } from 'react-bootstrap';
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
}

interface Medicine {
  medicineId?: number;
  name: string;
  pharmacy: string;
  offer_price?: number;
  normal_price?: number;
  image_url?: string;
}

export default function AlertsPage() {
  const [emailVerified, setEmailVerified] = useState(false);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const [selectedComparisons, setSelectedComparisons] = useState<{ [alertId: string]: Medicine[] }>({});

  const capitalizeWords = (text: string) =>
    decodeURIComponent(text)
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

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
              .then(setAlerts);
          } else {
            setEmailVerified(false);
          }
        })
        .catch(() => setEmailVerified(false));
    }
  }, []);

  const handleVerifyEmail = async () => {
    try {
      const stored = localStorage.getItem('userProfile');
      if (!stored) {
        toast.error("No se encontró el usuario.");
        return;
      }
      const user = JSON.parse(stored);
      const res = await fetch(`/api/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) toast.success('Correo de verificación enviado. Revisa tu bandeja de entrada.');
      else toast.error('Error al enviar el correo.');
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
        setSelectedComparisons(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      } else {
        toast.error('No se pudo eliminar la alerta.');
      }
    } catch {
      toast.error('Error al eliminar.');
    }
  };

  const handleCompare = async (alert: AlertData) => {
    try {
      const res = await fetch(`/api/compare-equivalents?id=${alert.medicineId}`);
      if (!res.ok) {
        toast.error('No se encontraron equivalentes.');
        setSelectedComparisons(prev => {
          const updated = { ...prev };
          delete updated[alert._id];
          return updated;
        });
        return;
      }
      const data = await res.json();
      const meds = data.medicines || [];
      setSelectedComparisons(prev => ({ ...prev, [alert._id]: meds }));
    } catch {
      toast.error('Error al buscar equivalentes.');
    }
  };

  return (
    <div className="container text-center py-5">
      <div className="mb-4">
        <FaBell size={48} color="#f1b600" />
      </div>

      <h2 className="fw-bold text-success">Tus Alertas de Precio</h2>

      {showVerifiedMessage && (
        <div className="alert alert-success fw-bold mb-4">
          ✅ Tu correo ha sido verificado correctamente.
        </div>
      )}

      {emailVerified ? (
        <>
          {alerts.length === 0 ? (
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
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={alert.imageUrl || 'https://via.placeholder.com/100'}
                        alt={alert.medicineName}
                        style={{ height: '90px', width: '100px', objectFit: 'contain' }}
                      />
                      <div className="text-start">
                        <h6 className="text-success fw-bold mb-1 text-uppercase">{alert.medicineName}</h6>
                        <p className="mb-0"><strong>Farmacia:</strong> {alert.pharmacy}</p>
                        <p className="mb-0"><strong>Categoría:</strong> {capitalizeWords(alert.category)}</p>

                        <div className="form-check mt-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`compare-${alert._id}`}
                            checked={!!selectedComparisons[alert._id]}
                            onChange={(e) => {
                              if (e.target.checked) handleCompare(alert);
                              else {
                                setSelectedComparisons(prev => {
                                  const updated = { ...prev };
                                  delete updated[alert._id];
                                  return updated;
                                });
                              }
                            }}
                          />
                          <label className="form-check-label text-muted" htmlFor={`compare-${alert._id}`}>
                            📉 Comparar genérico/marca
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
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

                  {selectedComparisons[alert._id]?.length > 0 && (
                    <div className="mt-4 border-top pt-3">
                      <h6 className="fw-bold text-dark mb-3">
                        Comparación con medicamentos similares:
                      </h6>
                      <div className="row">
                        {selectedComparisons[alert._id].map((med, idx) => (
                          <div key={idx} className="col-md-4 mb-4">
                            <Card className="h-100 shadow-sm">
                              <Card.Body>
                                <div className="d-flex align-items-center gap-3 mb-3">
                                  <img
                                    src={med.image_url}
                                    alt={med.name}
                                    style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                                  />
                                  <div className="text-start">
                                    <Card.Title className="text-success fw-bold mb-1 text-uppercase">{med.name}</Card.Title>
                                    <p className="mb-1"><strong>Farmacia:</strong> {med.pharmacy}</p>
                                    <p className="mb-1">
                                      <strong>Precio:</strong> ${Math.round(med.offer_price ?? med.normal_price)}
                                    </p>
                                  </div>
                                </div>
                                <div className="d-flex justify-content-end">
                                  <Link
                                    href={`/comparator/categories/${encodeURIComponent(alert.categorySlug)}/${encodeURIComponent(med.medicineId || '0')}`}
                                    className="btn btn-outline-primary btn-sm"
                                  >
                                    Ver detalle
                                  </Link>
                                </div>
                              </Card.Body>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="mb-4">
          <p className="text-danger fw-bold">Debes verificar tu correo electrónico para activar las alertas.</p>
          <button className="btn btn-outline-primary" onClick={handleVerifyEmail}>
            Verificar correo para recibir alertas
          </button>
        </div>
      )}

      <hr className="my-5" />

      <div className="mb-4">
        <h5 className="fw-bold mb-3 text-dark">¿Qué podrás activar aquí?</h5>
        <ul className="list-unstyled text-start d-inline-block">
          <li>🔔 Recibir alertas cuando un medicamento baje de precio</li>
          <li>📉 Comparar precios entre versiones genéricas y de marca</li>
          <li>📩 Activar notificaciones por correo electrónico</li>
        </ul>
      </div>
    </div>
  );
}
