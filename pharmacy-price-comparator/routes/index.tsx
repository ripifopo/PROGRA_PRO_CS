// Importamos componentes básicos de Fresh
import { h, Fragment } from "preact";
import Layout from "../components/AppLayout.tsx";

// Página de inicio principal
export default function Home() {
  return (
    <Layout title="Inicio">
      {/* Contenido principal en español */}
      <div class="container text-center py-5">
        <h1 class="display-4">Comparador de precios de medicamentos</h1>
        <p class="lead">Busca y compara precios de medicamentos en diferentes farmacias.</p>
        <a href="/comparator" class="btn btn-success btn-lg mt-3">
          Ir al comparador
        </a>
      </div>
    </Layout>
  );
}
