// Archivo principal del proyecto
// Este archivo inicia un servidor básico usando Deno
// Todo el código está en inglés, pero los comentarios están en español

// Importamos la función `serve` desde la librería estándar de Deno
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

// Definimos la función principal que manejará todas las solicitudes HTTP
function handler(request: Request): Response {
  const url = new URL(request.url);

  // Ruta principal "/"
  if (url.pathname === "/") {
    // Retornamos una página HTML simple para la ruta de inicio
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Inicio</title>
        </head>
        <body>
          <h1>Bienvenido al Comparador de Medicamentos</h1>
        </body>
      </html>
      `,
      {
        headers: { "content-type": "text/html; charset=utf-8" },
      }
    );
  }

  // Si la ruta no existe, mostramos error 404
  return new Response("Página no encontrada", { status: 404 });
}

// Mensaje en consola cuando el servidor inicia correctamente
console.log("Servidor corriendo en http://localhost:8000");

// Iniciamos el servidor usando la función `serve`
serve(handler, { port: 8000 });
