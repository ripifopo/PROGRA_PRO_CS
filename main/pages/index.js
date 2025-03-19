// pages/index.js
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <div>
      <Navbar />
      <header className="hero bg-light text-center py-5">
        <div className="container">
          <h1 className="display-4">Compara precios de medicamentos en línea</h1>
          <p className="lead">Encuentra las mejores ofertas y disponibilidad en farmacias de tu zona.</p>
          <a href="/comparador" className="btn btn-success btn-lg mt-3">Empieza a Comparar</a>
        </div>
      </header>
      <main className="container py-4">
        <h2>¿Por qué usar nuestro comparador?</h2>
        <p>
          Accede a información actualizada de precios, recibe alertas de descuentos y gestiona tus medicamentos de manera eficiente.
          Compara entre múltiples farmacias y mantén un historial de precios para detectar tendencias.
        </p>
      </main>
      <footer className="bg-dark text-white text-center py-3">
        <div className="container">
          <p>&copy; 2025 Comparador de Medicamentos. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
