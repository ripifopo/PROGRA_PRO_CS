// components/Navbar.js
import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        <a className="navbar-brand fw-bold" href="/">Comparador de Medicamentos</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="/">Inicio</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/comparador">Comparador</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/alertas">Alertas</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/historial">Historial</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/perfil">Perfil</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

