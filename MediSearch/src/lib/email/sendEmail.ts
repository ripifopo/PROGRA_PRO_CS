import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

if (!GMAIL_USER || !GMAIL_PASS) {
  console.warn('⚠️ Las variables GMAIL_USER o GMAIL_PASS no están definidas. No se enviarán correos.');
}

// 🚀 Reutilizamos un solo transporter
const transporter = GMAIL_USER && GMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    })
  : null;

/**
 * Envía un correo electrónico con nodemailer.
 * Muestra información detallada en consola y evita fallos silenciosos.
 */
export default async function sendEmail({ to, subject, html }: EmailParams) {
  if (!transporter) {
    console.error('[EMAIL] ❌ Transporter no disponible. Verifica tus variables de entorno.');
    return;
  }

  if (!to || !subject || !html) {
    console.error('[EMAIL] ❌ Faltan parámetros obligatorios para enviar el correo.');
    return;
  }

  const mailOptions = {
    from: `"PharmaSearch Alertas" <${GMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    if (ENVIRONMENT === 'development') {
      console.log('[EMAIL] 🧪 Modo desarrollo – correo no enviado realmente.');
      console.log('→ Para:', to);
      console.log('→ Asunto:', subject);
      return;
    }

    const info = await transporter.sendMail(mailOptions);

    if (info.accepted.includes(to)) {
      console.log(`[EMAIL] ✅ Correo enviado correctamente a ${to}`);
    } else {
      console.warn(`[EMAIL] ⚠️ El correo fue procesado pero no confirmado como entregado:`, info);
    }

    console.log('[EMAIL] 📬 Respuesta:', info.response);
  } catch (error: any) {
    console.error('[EMAIL] ✘ Error al enviar correo:', error?.message || error);
  }
}
