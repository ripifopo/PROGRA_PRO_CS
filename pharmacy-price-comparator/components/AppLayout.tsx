// Este layout envuelve el contenido general de la web
import { h, Fragment } from "preact";

export default function Layout(props: { title: string; children: any }) {
  return (
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title}</title>
        {/* Importamos Bootstrap desde CDN */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        />
      </head>
      <body class="bg-light">
        {props.children}
      </body>
    </html>
  );
}
