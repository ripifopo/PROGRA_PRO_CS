// Archivo: src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { usersCollection } from "../../../../lib/mongodb.ts";

// Ruta POST para registrar nuevos usuarios
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, lastname, birthday, region, comuna } = body;

    if (!email || !password || !name || !lastname || !birthday || !region || !comuna) {
      return NextResponse.json({ message: "Faltan campos requeridos" }, { status: 400 });
    }

    const users = await usersCollection;

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "El correo ya está registrado" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      name,
      lastname,
      birthday,
      region,
      comuna,
      createdAt: new Date()
    };

    await users.insertOne(newUser);

    return NextResponse.json({ message: "Usuario registrado correctamente" }, { status: 201 });
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json({ message: "Error interno al registrar el usuario" }, { status: 500 });
  }
}
