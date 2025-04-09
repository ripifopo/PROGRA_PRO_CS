# Propuesta de Métricas para Filtrado de Medicamentos en Plataforma de Comparación de Farmacias


El objetivo de esta propuesta es definir un conjunto de métricas que permita a los usuarios filtrar y comparar medicamentos ofrecidos por distintas farmacias de forma eficiente. Estas métricas deben facilitar la toma de decisiones, mejorar la experiencia del usuario y adaptarse a necesidades futuras de la plataforma.

## Métricas propuestas

A continuación se detallan las principales métricas a considerar para el sistema de filtrado:

- **Precio**: Permite al usuario ordenar por costo, útil para decisiones económicas.
- **Disponibilidad en stock**: Filtra medicamentos actualmente disponibles para evitar frustraciones.
- **Cercanía de la farmacia**: Utiliza geolocalización para mostrar opciones cercanas, especialmente útil en compras presenciales o envíos rápidos.
- **Tipo de medicamento**: Diferencia entre medicamentos genéricos y de marca.
- **Forma de presentación**: Búsqueda por formato, por ejemplo, tabletas, jarabe, cápsulas, ... 
- **Promociones vigentes**: Permite identificar ofertas activas que pueden representar un ahorro.

Estas métricas fueron seleccionadas con base en criterios de:

- Usabilidad para el usuario final.
- Valor informativo en el proceso de decisión de compra.
- Factibilidad de obtención mediante técnicas como web scraping y API públicas.

Cada una aporta a la decisión informada del usuario en distintos contextos de urgencia, presupuesto o preferencia personal. Además de hacer el proceso de uso de la página lo más facil y eficiente posible para el cliente. 

## Relación con Web Scraping

Actualmente, un miembro del equipo está trabajando en la obtención de datos mediante **web scraping de tres farmacias distintas**. Este proceso está permitiendo acceder a información clave como:

- **Precios actualizados por producto**
- **Disponibilidad en stock**
- **Promociones activas visibles en el sitio web**

Estos datos recolectados servirán como base para alimentar las métricas mencionadas anteriormente, en especial para el filtrado por **precio**, **stock**, y **promociones vigentes**.

## Escalabilidad

La estructura propuesta permite añadir nuevas métricas en el futuro, como por ejemplo:

- **Preferencias personalizadas del usuario** (farmacias favoritas, historial de compras).
- **Reputación basada en reseñas o puntuaciones**.
- **Opciones de cobertura médica o reembolso por seguros**.

Esto asegura que la solución sea **flexible y escalable**, acompañando la evolución de la plataforma.

## Conclusiones

Si bien esta tarea es de documentación e investigación, nuestro objetivo en esta fase temprana del proyecto es priorizar la implementación de métricas con datos ya disponibles que pudimos obtener gracias al web scraping, diseñar el sistema de filtrado de forma modular para facilitar la incorporación de nuevas métricas a futuro y alinear los formatos de datos recolectados del web scraping para que sean comparables entre farmacias.


