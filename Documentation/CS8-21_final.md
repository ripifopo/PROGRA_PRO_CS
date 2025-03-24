# Investigación de Opciones de Notificaciones
Esta tarea consiste en investigar y documentar las diferentes opciones disponibles para el envío de notificaciones en nuestra página, considerando variables como son los costos, facilidad de intgración, escalabilidad y cumplimiento con normativas de protección de datos. El objetivo de esto es poder seleccionar la mejor opción para notificar a los usuarios sobre cambios en los precios, ofertas únicas, disponibilidad en farmacias cercanas, entre otras cosas.

---

## Opciones de Notificación Evaluadas
Se consideraron tres tipos de notificaciones principales, las más famosas en verdad:

1. **SMS**
2. **Correo Electrónico (Gmail, SendGrid, Amazon SES)**
3. **WhatsApp (API Oficial y Alternativas sin API Oficial)**

Cada opción fue analizada bajo los siguientes criterios:
- **Costo:** Tarifas asociadas al envío de mensajes.
- **Facilidad de integración:** APIs y compatibilidad con la plataforma.
- **Escalabilidad:** Capacidad para manejar un gran volumen de notificaciones.
- **Regulación:** Protección de datos y cumplimiento normativo.
- **Eficiencia:** Tasa de entrega y efectividad del canal.

### 1. SMS
**Ventajas:**
- Alta tasa de apertura, ya que suelen ser entregados directamente al dispositivo del usuario.
- No requiere internet, lo que lo hace accesible.
- APIs disponibles para integración (Twilio, Nexmo, Plivo).

**Desventajas:**
- Costo elevado por mensaje enviado.
- Limitaciones en la cantidad de caracteres, dependiendo del servicio.
- Puede ser filtrado como SPAM por algunos operadores.

**Costo Aproximado:**
- Twilio: ~$0.0075 por mensaje enviado.

### 2. Correo Electrónico (Gmail, SendGrid, Amazon SES)
**Ventajas:**
- Bajo costo o gratuito para envíos masivos.
- Fácil integración con plataformas mediante SMTP o APIs.
- Permite incluir información detallada, enlaces e imágenes.

**Desventajas:**
- Baja tasa de apertura en comparación con SMS, ya que hay una clasificación automática de los mensajes, por ejemplo la clasificación de bandejas (Principal, Social, Promociones, Notificaciones y Spam). 
- Puede ser filtrado como SPAM si no se configuran correctamente los servidores.
- Dependencia de internet.

**Costo Aproximado:**
- Amazon SES: $0.10 por 1,000 correos.
- SendGrid: Plan gratuito hasta 100 correos diarios.

### 3. WhatsApp (API Oficial y Alternativas sin API Oficial)
**Ventajas:**
- Alta tasa de apertura, ya que es el uso frecuente de comunicación y notificación de las empresas y personas con la implementación de WhatsApp Business.
- Soporte para mensajes interactivos e imágenes.
- Integración con chatbots y sistemas automatizados con IA.

**Desventajas:**
- WhatsApp Business API tiene costos por mensaje enviado.
- Algunas regulaciones pueden restringir el uso masivo.

**Costo Aproximado:**
- WhatsApp Business API: Desde $0.005 por mensaje.

**Alternativa sin API Oficial:**
- Generar enlaces de WhatsApp Web manualmente.
- Usar bots gratuitos como ManyChat o Make.

---

## Comparación Final
| Opción       | Costo | Facilidad de Integración | Escalabilidad | Regulación | Tasa de Entrega |
|-------------|-------|-------------------------|---------------|------------|----------------|
| **SMS** | Alto | Fácil | Alta | Estricta | 90% |
| **Email** | Bajo | Fácil | Muy Alta | Relajado | 30-40% |
| **WhatsApp (API Oficial)** | Medio | Media | Alta | Estricta | 90% |
| **WhatsApp (sin API)** | Bajo | Media | Media | Relajado | 90% |

## Conclusión: Implementación en Deno

Tras evaluar todas las opciones, se ha decidido implementar el sistema de notificaciones utilizando **Deno con TypeScript** debido a su seguridad integrada, soporte nativo para TypeScript y facilidad de despliegue sin necesidad de dependencias externas como npm. Además, tal como lo visto en clase, soluciona mucho de los problemas que tiene node.js respecto a ciberseguridad, por lo que a lo largo del proyecto utilizaremos Deno.

La estrategia de notificación final será la siguiente:

1. **Correo Electrónico (SMTP - Gmail o SendGrid)**:
   - Se utilizará para enviar notificaciones detalladas y correos transaccionales.
   - Implementación a través de **SMTP**, sin costo adicional para los primeros 100 correos diarios con SendGrid.
   - Mayor facilidad de integración y escalabilidad.

2. **WhatsApp sin API Oficial (Vía WhatsApp Web o Bots Gratuitos)**:
   - No se utilizará la API oficial de WhatsApp para evitar costos adicionales.
   - Se generarán enlaces de WhatsApp Web para notificaciones rápidas.
   - Se evaluarán herramientas de automatización gratuita como ManyChat o Make.

Este enfoque permite **minimizar costos** y **facilitar la integración**, asegurando una alta tasa de entrega con métodos accesibles y escalables.

Para la implementación, seguirá la siguiente estructura de archivos:

```
/notificaciones-deno
│── src/
│   ├── services/
│   │   ├── emailService.ts   # Envío de correos con SMTP
│   │   ├── whatsappService.ts  # Envío de WhatsApp sin API oficial
│   │   ├── config.ts   # Configuración de variables de entorno
│   ├── main.ts  # Punto de entrada del sistema de notificaciones
│── .env  # Variables de entorno
│── deno.json  # Configuración de Deno
│── README.md  # Documentación del proyecto
```

Para la implementación técnica, se utilizarán los siguientes métodos:
- **Email:** Usando `deno.land/x/smtp` para enviar correos a través de Gmail SMTP o SendGrid.
- **WhatsApp:** Generando enlaces de WhatsApp Web de manera manual o usando bots gratuitos.

De todas formas a lo largo del proyecto evaluaremos los cambios pertinentes a realizar, pero como primera toma de decisión y bajo las variables analizadas realizaremos esto.

-------
## Fuentes:
- Twilio SMS API: https://www.twilio.com/sms 
- Vonage SMS API: https://www.vonage.com/communications-apis/ 
- Plivo SMS API: https://www.plivo.com/sms/ 
- SendGrid Free Plan: https://sendgrid.com/free
- Amazon SES: https://aws.amazon.com/ses/ 
- WhatsApp Business API: https://business.whatsapp.com/products/business-platform?lang=es_LA 
- Gmail SMTP Setup: https://support.google.com/a/answer/176600?hl=es


