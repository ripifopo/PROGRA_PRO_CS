'use client';

import Link from 'next/link';
import { FaBell, FaUserCircle, FaHome, FaPills } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { isLoggedIn } = useAuth();
  const [hasTrigger, setHasTrigger] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('userProfile');
    if (!stored) return;

    const { email } = JSON.parse(stored);

    const fetchTriggerStatus = () => {
      fetch(`/api/alerts/has-trigger?email=${email}`)
        .then(res => res.json())
        .then(data => {
          if (data?.hasTrigger) setHasTrigger(true);
          else setHasTrigger(false);
        })
        .catch(() => setHasTrigger(false));
    };

    fetchTriggerStatus(); // ✅ Revisión inicial

    const interval = setInterval(fetchTriggerStatus, 60 * 1000); // 🔄 Cada 60 segundos

    // 🧠 Escuchar evento personalizado desde AlertsPage
    const listener = () => fetchTriggerStatus();
    window.addEventListener('trigger-status-updated', listener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('trigger-status-updated', listener);
    };
  }, []);

  return (
    <nav
      className="navbar navbar-expand-lg"
      style={{ backgroundColor: '#e8f5e9', borderBottom: '2px solid #c8e6c9' }}
    >
      <div className="container">
        <a className="navbar-brand fw-bold text-success d-flex align-items-center gap-2" href="/">
          <FaPills size={20} /> PharmaSearch
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 d-flex align-items-center gap-3">
            <li className="nav-item">
              <Link className="nav-link text-success d-flex align-items-center gap-1" href="/">
                <FaHome size={16} /> Inicio
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-success d-flex align-items-center gap-1" href="/comparator">
                <FaPills size={16} /> Comparador
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-success d-flex align-items-center gap-1" href="/profile">
                <FaUserCircle size={18} /> Perfil
              </Link>
            </li>

            {isLoggedIn && (
              <li className="nav-item position-relative">
                <Link className="nav-link" href="/alerts" title="Alertas">
                  <div
                    className="rounded-circle border border-success d-flex justify-content-center align-items-center bg-white shadow-sm"
                    style={{ width: '36px', height: '36px' }}
                  >
                    <FaBell size={16} color="#218754" />
                  </div>

                  {/* 🔴 Puntito si hay alertas triggered */}
                  {hasTrigger && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
                      style={{ width: '10px', height: '10px' }}
                    ></span>
                  )}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
