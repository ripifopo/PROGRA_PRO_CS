// Archivo: src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { usersCollection } from "../../../../lib/mongodb.ts"; // Ruta absoluta desde tsconfig.json

// Ruta para registrar nuevos usuarios en la base de datos
export async function POST(req: NextRequest) {
  try {
    // Se extraen los datos enviados desde el frontend en formato JSON
    const body = await req.json();
    const { email, password, name, lastname, birthday, region, weight } = body;

    // Se valida que los campos requeridos estén presentes
    if (!email || !password || !name || !lastname || !birthday || !region || !weight) {
      return NextResponse.json(
        { message: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Se verifica si ya existe un usuario registrado con el mismo correo
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { message: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    // Se cifra la contraseña con bcrypt antes de almacenarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // Se construye el objeto del nuevo usuario
    const newUser = {
      email,
      password: hashedPassword,
      name,
      lastname,
      birthday,
      region,
      weight,
      createdAt: new Date(),
    };

    // Se inserta el nuevo usuario en la base de datos
    await usersCollection.insertOne(newUser);

    // Se devuelve respuesta exitosa
    return NextResponse.json(
      { message: "Usuario registrado correctamente" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json(
      { message: "Error interno al registrar el usuario" },
      { status: 500 }
    );
  }
}
