'use client';

export default function LoadingSpinner() {
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex justify-content-center align-items-center" style={{ zIndex: 9999 }}>
      <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );
}
