// Archivo: src/lib/email/sendEmail.ts

import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

export default async function sendEmail({ to, subject, html }: EmailParams) {
  const mailOptions = {
    from: `"PharmaSearch" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[✔] Correo enviado:', info.response);
  } catch (error) {
    console.error('[✘] Error al enviar correo:', error);
  }
}
