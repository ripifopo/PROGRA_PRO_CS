import { NextRequest, NextResponse } from "next/server";
import { verifiedUsersCollection } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

// Configuración de nodemailer con cuenta de Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  // Validar que el correo fue enviado
  if (!email) {
    return NextResponse.json({ error: "Email es requerido." }, { status: 400 });
  }

  // Verificar si ya existe un usuario con ese correo
  const existingUser = await verifiedUsersCollection.findOne({ email });

  if (existingUser) {
    if (existingUser.verified) {
      // Si ya está verificado, no enviamos el correo nuevamente
      return NextResponse.json({ message: "El usuario ya está verificado." }, { status: 200 });
    }

    // Si ya existe pero no está verificado, generamos nuevo token y reenviamos
    const newToken = uuidv4();
    await verifiedUsersCollection.updateOne(
      { email },
      { $set: { verificationToken: newToken, createdAt: new Date() } }
    );

    const verificationLink = `${process.env.BASE_URL}/api/verify?token=${newToken}`;

    await transporter.sendMail({
      from: `"PharmaSearch" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verificación de cuenta PharmaSearch",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
          <h2>🎉 Bienvenido a <span style="color:#2a9d8f;">PharmaSearch</span> 💊</h2>
          <p>Gracias por unirte a nuestra plataforma de comparación de medicamentos.</p>
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

    return NextResponse.json({ message: "Correo de verificación reenviado." }, { status: 200 });
  }

  // Si es un usuario nuevo, lo registramos en la colección y enviamos el correo
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
    from: `"PharmaSearch" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verificación de cuenta PharmaSearch",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
        <h2>🎉 Bienvenido a <span style="color:#2a9d8f;">PharmaSearch</span> 💊</h2>
        <p>Gracias por unirte a nuestra plataforma de comparación de medicamentos.</p>
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
