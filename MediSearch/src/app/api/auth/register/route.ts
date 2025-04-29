// Archivo: src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { usersCollection } from "../../../../lib/mongodb.ts";

// Ruta API para manejar el registro de nuevos usuarios
export async function POST(req: NextRequest) {
  try {
    // Se obtiene el cuerpo de la solicitud
    const body = await req.json();
    const { email, password, name, lastname, birthday, region, comuna } = body;

    // Validación: Verifica que todos los campos requeridos estén presentes
    if (!email || !password || !name || !lastname || !birthday || !region || !comuna) {
      return NextResponse.json({ message: "Faltan campos requeridos" }, { status: 400 });
    }

    // Conexión a la colección de usuarios en la base de datos
    const users = await usersCollection;

    // Verifica si el correo ya se encuentra registrado
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "El correo ya está registrado" }, { status: 400 });
    }

    // Cifra la contraseña utilizando bcryptjs para mayor seguridad
    const hashedPassword = await bcrypt.hash(password, 10);

    // Construcción del nuevo objeto usuario a insertar en la base de datos
    const newUser = {
      email,
      password: hashedPassword,
      name,
      lastname,
      birthday,
      region,
      comuna,
      createdAt: new Date() // Fecha de creación del registro
    };

    // Inserta el nuevo usuario en la colección
    await users.insertOne(newUser);

    // Respuesta de éxito en el registro
    return NextResponse.json({ message: "Usuario registrado correctamente" }, { status: 201 });
  } catch (error) {
    // Manejo de errores imprevistos durante el proceso de registro
    console.error("Error en el registro:", error);
    return NextResponse.json({ message: "Error interno al registrar el usuario" }, { status: 500 });
  }
}
