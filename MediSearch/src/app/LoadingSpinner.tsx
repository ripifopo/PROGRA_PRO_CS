// Archivo: src/app/LoadingSpinner.tsx
'use client';

export default function LoadingSpinner() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(255,255,255,0.8)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div className="spinner-border text-success" style={{ width: '4rem', height: '4rem' }} />
    </div>
  );
}
