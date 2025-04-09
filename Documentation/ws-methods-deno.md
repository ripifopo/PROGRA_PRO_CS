# Investigar sobre métodos para scrapear páginas cargadas dinámicamente

Para obtener información estructurada desde sitios web que no exponen directamente los datos en el HTML, se utilizará el análisis del tráfico de red del navegador con el fin de identificar las APIs internas utilizadas por el frontend para cargar los datos dinámicamente. Este procedimiento evita el uso de navegadores headless o motores de renderizado y permite acceder a los datos en formato JSON de manera más eficiente.

1. Análisis de tráfico desde el navegador
Se accede al sitio web en cuestión utilizando un navegador moderno (Google Chrome o Firefox) y se abre la consola de herramientas de desarrollador (F12). En la pestaña “Network” se realiza un filtrado por tipo de solicitud “XHR” o “Fetch”, que corresponde a las llamadas realizadas por JavaScript para obtener datos desde APIs internas.

La página se recarga (F5) para capturar todas las solicitudes. Se inspeccionan aquellas cuyo nombre o ruta sugiere que contienen datos de productos o información útil para el scraping, por ejemplo:

/api/product-summary

/product-service/products

/catalog/products

2. Identificación de la API de interés
Se selecciona una de las solicitudes y se verifica en la pestaña “Response” que la respuesta esté en formato JSON, conteniendo atributos relevantes (nombre del producto, precios, stock, etc.).

A continuación, se extrae la URL completa desde la pestaña “Headers”, incluyendo parámetros relevantes como ids[]=, sku=, offset, page, etc. Esta URL será la base para las consultas automatizadas.

3. Evaluación del comportamiento de la API
Antes de utilizar la API en el scraper, se analiza su comportamiento para determinar:

Qué parámetros requiere para funcionar (ID de producto, cantidad por página, filtros).

Si permite realizar consultas múltiples en una misma solicitud (por ejemplo, ids[]=123&ids[]=456).

Si requiere headers específicos, como User-Agent o Authorization.

Si utiliza paginación, qué parámetros controlan el desplazamiento (offset, limit, page).

Se testean estas combinaciones directamente desde el navegador o herramientas como Postman.

4. Integración en el scraper
Una vez conocida la estructura y comportamiento de la API, se implementa la lógica de scraping desde el entorno de desarrollo (por ejemplo, utilizando fetch en Deno o axios en Node.js), simulando las mismas peticiones observadas en el navegador.

La respuesta JSON se procesa para extraer los campos requeridos, sin necesidad de procesar el HTML de la página. Esto permite reducir significativamente el tiempo de ejecución y la carga de red. 

Este método es aplicable principalmente a sitios construidos como SPA (Single Page Applications) o con frameworks modernos que utilizan APIs internas para cargar información. Se recomienda validar siempre el contenido del archivo robots.txt del sitio web para respetar sus restricciones de uso automatizado.