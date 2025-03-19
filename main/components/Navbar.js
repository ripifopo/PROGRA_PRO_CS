import React from 'react';

const Navbar = () => {
  return (
    <nav style={{ backgroundColor: '#333', padding: '10px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
        <a href="/" style={{ color: '#fff', marginRight: '20px', textDecoration: 'none' }}>Inicio</a>
        <a href="#menu" style={{ color: '#fff', marginRight: '20px', textDecoration: 'none' }}>Menú</a>
        <a href="#reservas" style={{ color: '#fff', textDecoration: 'none' }}>Reservas</a>
      </div>
    </nav>
  );
};

export default Navbar;
