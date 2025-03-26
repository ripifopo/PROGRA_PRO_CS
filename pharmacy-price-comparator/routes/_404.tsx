import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Página no encontrada</title>
      </Head>
      <div class="px-4 py-8 mx-auto text-center bg-light">
        <h1 class="display-4">404 - Página no encontrada</h1>
        <p class="lead">Lo sentimos, la página que buscas no existe.</p>
        <a href="/" class="btn btn-primary mt-3">Volver al inicio</a>
      </div>
    </>
  );
}
