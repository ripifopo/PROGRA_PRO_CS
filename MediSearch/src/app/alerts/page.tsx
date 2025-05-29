// Archivo: src/app/alerts/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBell } from 'react-icons/fa';
import { XCircleFill } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';

interface AlertData {
  _id: string;
  medicineName: string;
  pharmacy: string;
  category: string;
  userEmail: string;
  medicineSlug: string;
  categorySlug: string;
  imageUrl?: string;
  createdAt: string;
}

export default function AlertsPage() {
  const router = useRouter();
  const [emailVerified, setEmailVerified] = useState(false);
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  // Capitaliza cada palabra de una cadena
  const capitalizeWords = (text: string) => {
    return decodeURIComponent(text)
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const user = JSON.parse(stored);
      if (user.verified) setEmailVerified(true);

      fetch(`/api/alerts?email=${user.email}`)
        .then(res => res.json())
        .then(setAlerts);
    }
  }, []);

  const handleVerifyEmail = async () => {
    toast.success('Correo de verificación enviado. Revisa tu bandeja de entrada.');
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

  return (
    <div className="container text-center py-5">
      <div className="mb-4">
        <FaBell size={48} color="#f1b600" />
      </div>

      <h2 className="fw-bold text-success">Tus Alertas de Precio</h2>
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
            <div
              key={alert._id}
              className="d-flex align-items-center justify-content-between bg-light shadow-sm rounded p-3 mb-3"
            >
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
          ))}
        </div>
      )}

      <hr className="my-5" />

      <div className="mb-4">
        <h5 className="fw-bold mb-3 text-dark">¿Qué podrás activar aquí?</h5>
        <ul className="list-unstyled text-start d-inline-block">
          <li>🔔 Recibir alertas cuando un medicamento baje de precio</li>
          <li>📉 Comparar precios entre versiones genéricas y de marca</li>
          <li>📩 Activar notificaciones por correo electrónico</li>
          <li>💬 Recibir alertas por WhatsApp (próximamente)</li>
        </ul>
      </div>

      <div className="mb-4">
        {emailVerified ? (
          <p className="text-success fw-bold">Correo verificado correctamente.</p>
        ) : (
          <button className="btn btn-outline-primary" onClick={handleVerifyEmail}>
            Verificar correo para recibir alertas
          </button>
        )}
      </div>

      <div className="mb-5">
        <h6 className="fw-bold mb-2 text-dark">¿Prefieres WhatsApp?</h6>
        <button className="btn btn-outline-success" disabled>
          Conectar con WhatsApp Business (próximamente)
        </button>
      </div>
    </div>
  );
}
