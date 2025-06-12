import { NextRequest, NextResponse } from "next/server";
import { verifiedUsersCollection } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

// Configuración de nodemailer para Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email es requerido." }, { status: 400 });
  }

  const existingUser = await verifiedUsersCollection.findOne({ email });

  if (existingUser) {
    return NextResponse.json({ message: "Ya existe este email." }, { status: 200 });
  }

  const verificationToken = uuidv4();
  const newUser = {
    email,
    verified: false,
    verificationToken,
    createdAt: new Date()
  };

  await verifiedUsersCollection.insertOne(newUser);

  const verificationLink = `${process.env.BASE_URL}/api/verify?token=${verificationToken}`;

  await transporter.sendMail({
    from: `"MediSearch" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verificación de cuenta MediSearch",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
        <h2>🎉 Bienvenido a <span style="color:#2a9d8f;">MediSearch</span> 💊</h2>
        <p>¡Gracias por unirte a nuestra plataforma de comparación de medicamentos!</p>
        <p>Por favor confirma tu correo electrónico para poder recibir alertas personalizadas:</p>
        <a href="${verificationLink}" 
           style="background-color:#2a9d8f; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">
           ✅ Verificar Cuenta
        </a>
        <p style="margin-top:20px; font-size:12px; color:#999;">
          Si no solicitaste esta verificación, puedes ignorar este correo.
        </p>
      </div>
    `
  });

  return NextResponse.json({ message: "Correo de verificación enviado." }, { status: 200 });
}
