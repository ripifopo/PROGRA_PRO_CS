// Archivo: src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { usersCollection } from "@/lib/mongodb";

// Ruta POST para registrar nuevos usuarios
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, lastname, birthday, region } = body;

    if (!email || !password || !name || !lastname || !birthday || !region) {
      return NextResponse.json({ message: "Faltan campos requeridos" }, { status: 400 });
    }

    // Desempaqueta la colección
    const users = await usersCollection;

    // Verifica si ya existe un usuario con el mismo email
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "El correo ya está registrado" }, { status: 400 });
    }

    // Cifra la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // Objeto del nuevo usuario
    const newUser = {
      email,
      password: hashedPassword,
      name,
      lastname,
      birthday,
      region,
      createdAt: new Date()
    };

    // Inserta el usuario en la colección
    await users.insertOne(newUser);

    return NextResponse.json({ message: "Usuario registrado correctamente" }, { status: 201 });
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json({ message: "Error interno al registrar el usuario" }, { status: 500 });
  }
}
