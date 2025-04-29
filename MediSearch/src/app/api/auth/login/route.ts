// Archivo: src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { usersCollection } from "../../../../lib/mongodb.ts";
import { SignJWT } from "jose";

// Codifica la clave secreta utilizada para firmar los tokens JWT
const encoder = new TextEncoder();
const JWT_SECRET = encoder.encode(process.env.JWT_SECRET || "fallback-secret");

// Función que genera un token JWT con los datos proporcionados y expiración de 1 hora
async function generateToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("1h")
    .sign(JWT_SECRET);
}

// Ruta POST que maneja la autenticación de usuarios
export async function POST(req: NextRequest) {
  try {
    // Se obtiene el cuerpo de la solicitud con email y password
    const { email, password } = await req.json();

    // Validación básica de existencia de campos
    if (!email || !password) {
      return NextResponse.json({ message: "Correo y contraseña requeridos" }, { status: 400 });
    }

    // Se accede a la colección de usuarios
    const users = await usersCollection;

    // Búsqueda del usuario por su correo electrónico
    const user = await users.findOne({ email });

    // Si no se encuentra el usuario, se devuelve error de autenticación
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 });
    }

    // Comparación entre la contraseña ingresada y la almacenada (cifrada)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Contraseña incorrecta" }, { status: 401 });
    }

    // Si las credenciales son correctas, se genera un token JWT
    const token = await generateToken({
      email: user.email,
      name: user.name,
      id: user._id.toString(),
    });

    // Respuesta con información básica del usuario, incluyendo región y comuna
    const response = NextResponse.json(
      {
        message: "Inicio de sesión exitoso",
        token,
        user: {
          email: user.email,
          name: user.name,
          lastname: user.lastname,
          birthday: user.birthday,
          region: user.region,
          comuna: user.comuna
        }
      },
      { status: 200 }
    );

    // Configura la cookie segura para guardar el token JWT
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60, // Duración de 1 hora
      path: "/"
    });

    return response;
  } catch (error) {
    // Manejo de errores internos del servidor
    console.error("Error en el login:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
