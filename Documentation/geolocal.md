# Investigación de servicios de geolocalización y compatibilidad con el proyecto

Para esta investigación se consideraron cinco servicios de geolocalización ampliamente utilizados, con el fin de evaluar su compatibilidad técnica y funcional con el proyecto. Los servicios investigados fueron:

1. **Google Maps Platform**
2. **Mapbox**
3. **OpenStreetMap** (con Nominatim u otros servicios como LocationIQ)
4. **Here Technologies**
5. **TomTom**

## Criterios de comparación

Para comparar los servicios se definieron los siguientes criterios, en base a los requerimientos del proyecto:

### 1. Facilidad de integración

- **Google Maps**: Ofrece SDKs completos para múltiples plataformas (web, móvil), junto con una documentación clara. La integración es directa.
- **Mapbox**: También cuenta con una integración sencilla, especialmente para entornos frontend modernos como React o Vue. Posee una buena API de JavaScript.
- **OpenStreetMap (Nominatim)**: Requiere integración manual y manejo propio del mapa si no se usa un servicio adicional. Puede ser más complejo para proyectos pequeños.
- **Here y TomTom**: Ambos ofrecen SDKs similares a Google Maps, con herramientas bien estructuradas y documentación adecuada.

### 2. APIs disponibles

- **Google Maps**: Incluye una amplia variedad de APIs (Maps, Places, Geocoding, Directions, etc.).
- **Mapbox**: Dispone de APIs para geocodificación, rutas, mapas interactivos y personalización visual.
- **OpenStreetMap (Nominatim)**: Brinda geocodificación básica, pero no incluye mapas interactivos por defecto.
- **Here y TomTom**: Ofrecen APIs similares a Google y Mapbox, orientadas a navegación, mapas y análisis espacial.

### 3. Costo

- **Google Maps**: Ofrece $200 USD gratuitos al mes. Superado ese límite, comienza a cobrar por cada tipo de solicitud.
- **Mapbox**: Plan gratuito que permite hasta 50.000 solicitudes al mes, con precios accesibles después.
- **OpenStreetMap (Nominatim)**: Gratuito si se usa su endpoint público, pero con limitaciones estrictas de uso. Alternativas como LocationIQ ofrecen planes económicos.
- **Here y TomTom**: Ambos tienen planes gratuitos limitados y comienzan a cobrar al superar ciertos umbrales.

### 4. Precisión de la ubicación

- **Google Maps**: Altísima precisión gracias a su base de datos comercial.
- **Mapbox**: Muy precisa, utiliza datos propios y de OpenStreetMap.
- **OpenStreetMap**: La precisión puede variar según la zona geográfica. En áreas urbanas tiende a ser bastante buena.
- **Here y TomTom**: También tienen alta precisión, especialmente en entornos urbanos.

### 5. Limitaciones

- **Google Maps**: Requiere uso de API key y tiene un estricto control sobre el uso de la API. No permite el uso sin conexión.
- **Mapbox**: También requiere token, pero permite más flexibilidad visual. Algunas funciones avanzadas requieren planes pagos.
- **OpenStreetMap (Nominatim)**: El uso del endpoint público está limitado a pocas solicitudes por segundo. No apto para producción sin contratar un proveedor externo.
- **Here y TomTom**: Requieren registro y uso de credenciales, con límites similares a los de otros servicios comerciales.

---
Dado que el proyecto consiste en una plataforma para comparar precios de farmacias, se requieren funciones como:

- Geocodificación directa e inversa (para obtener la dirección del usuario o buscar farmacias cercanas).
- Posible visualización en mapa interactivo.
- Bajo costo, ya que el proyecto está en fase inicial.
- Facilidad de integración con Deno + TypeScript.

Se optó por **Mapbox** para la implementación de geolocalización en el proyecto, ya que:

- El plan gratuito cubre sobradamente las necesidades del proyecto semestral (50.000 requests mensuales es más que suficiente).
- La integración es directa con fetch y TypeScript.
- No se requiere asociar tarjeta de crédito para usar el servicio en desarrollo.
- Existe abundante documentación, ejemplos y comunidad de soporte.

Además, Mapbox permite ajustar los tokens para restringir el uso por dominio o entorno, lo que agrega una capa extra de seguridad al uso de la API.


