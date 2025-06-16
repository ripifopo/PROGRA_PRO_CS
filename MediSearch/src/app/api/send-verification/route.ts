import { NextRequest, NextResponse } from "next/server";
import { usersCollection, verifiedUsersCollection } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Función para generar el HTML con nombre
function generateHtml(fullName: string, link: string): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
      <h2 style="color:#2a9d8f;">Hola ${fullName} 👋</h2>
      <h3>Bienvenido a <span style="color:#2a9d8f;">PharmaSearch</span> 💊</h3>
      <p>Gracias por unirte a nuestra plataforma de comparación de medicamentos.</p>
      <p style="margin: 12px 0; color: #6c3483;">
        Por favor, verifica tu correo electrónico para comenzar a recibir alertas personalizadas:
      </p>

      <p style="margin: 28px 0;">
        <a href="${link}" 
           style="background-color:#2a9d8f; color:white; padding:14px 30px; text-decoration:none;
                  border-radius:8px; font-weight:bold; display:inline-block; font-size:16px;">
          Verificar Cuenta
        </a>
      </p>

      <p style="font-size: 14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p style="word-break:break-all; font-size:14px;">
        <a href="${link}" style="color:#2a9d8f;">${link}</a>
      </p>

      <p style="margin-top:25px; font-size:12px; color:#999;">
        Si no solicitaste esta verificación, puedes ignorar este correo.
      </p>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email es requerido." }, { status: 400 });
  }

  // Buscamos el perfil del usuario para usar su nombre
  const userProfile = await usersCollection.findOne({ email });
  const fullName = userProfile
    ? `${(userProfile.name || "").trim()} ${(userProfile.lastname || "").trim()}`
    : email.split("@")[0];

  const existing = await verifiedUsersCollection.findOne({ email });

  if (existing) {
    if (existing.verified) {
      return NextResponse.json({ message: "El usuario ya está verificado." }, { status: 200 });
    }

    const newToken = uuidv4();
    await verifiedUsersCollection.updateOne(
      { email },
      { $set: { verificationToken: newToken, createdAt: new Date() } }
    );

    const link = `${process.env.BASE_URL}/api/verify?token=${newToken}`;
    await transporter.sendMail({
      from: `"PharmaSearch" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "🔁 Reenvío de verificación - PharmaSearch",
      html: generateHtml(fullName, link),
    });

    return NextResponse.json({ message: "Correo reenviado correctamente." }, { status: 200 });
  }

  // Usuario nuevo: insertar en verificados
  const token = uuidv4();
  await verifiedUsersCollection.insertOne({
    email,
    verified: false,
    verificationToken: token,
    createdAt: new Date(),
  });

  const link = `${process.env.BASE_URL}/api/verify?token=${token}`;
  await transporter.sendMail({
    from: `"PharmaSearch" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verificación de cuenta PharmaSearch",
    html: generateHtml(fullName, link),
  });

  return NextResponse.json({ message: "Correo enviado correctamente." }, { status: 200 });
}
