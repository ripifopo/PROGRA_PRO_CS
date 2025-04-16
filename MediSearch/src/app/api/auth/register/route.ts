// Archivo: src/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { hash } from "npm:bcryptjs";
import { usersCollection } from "../../../../lib/mongodb.ts";

// Ruta para registrar nuevos usuarios en la base de datos
export async function POST(req: NextRequest) {
  try {
    // Se extraen los datos enviados por el frontend
    const body = await req.json();
    const { email, password, name, lastname, birthday, region, weight } = body;

    // Se verifica si ya existe un usuario con el mismo correo
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { message: "El correo ya está registrado." },
        { status: 400 }
      );
    }

    // Se cifra la contraseña antes de guardarla
    const hashedPassword = await hash(password, 10);

    // Se construye el nuevo usuario a registrar
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

    // Se inserta el nuevo usuario en la colección
    await usersCollection.insertOne(newUser);

    // Respuesta exitosa
    return NextResponse.json(
      { message: "Usuario registrado correctamente" },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error en el registro:", error);
    return NextResponse.json(
      { message: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
