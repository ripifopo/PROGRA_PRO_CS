// Archivo: src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { usersCollection } from "../../../../lib/mongodb.ts";
import { SignJWT } from "jose";

// Se obtiene y codifica la clave secreta desde .env
const encoder = new TextEncoder();
const JWT_SECRET = encoder.encode(process.env.JWT_SECRET || "fallback-secret");

// Función para generar token JWT
async function generateToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("1h")
    .sign(JWT_SECRET);
}

// Endpoint POST para login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Correo y contraseña requeridos" }, { status: 400 });
    }

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Contraseña incorrecta" }, { status: 401 });
    }

    const token = await generateToken({
      email: user.email,
      name: user.name,
      id: user._id.toString(),
    });

    const response = NextResponse.json(
      {
        message: "Inicio de sesión exitoso",
        token,
        user: {
          email: user.email,
          name: user.name,
          lastname: user.lastname,
          birthday: user.birthday,
          region: user.region
        }
      },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60,
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("Error en el login:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
