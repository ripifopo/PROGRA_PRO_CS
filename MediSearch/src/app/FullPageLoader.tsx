// Archivo: src/app/FullPageLoader.tsx

'use client';

import './FullPageLoader.css'; // estilos por separado (te doy abajo el contenido)

export default function FullPageLoader() {
  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="loading-logo">MediSearch</div>
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
    </div>
  );
}
