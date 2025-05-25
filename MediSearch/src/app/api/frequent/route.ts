// Archivo: src/app/api/frequent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { frequentMedicinesCollection } from '../../../lib/mongodb.ts';
import { FrequentMedicine } from '../../../lib/models/FrequentMedicine.ts';

// API que permite registrar un medicamento como frecuente
export async function POST(req: NextRequest) {
  try {
    // Se extraen los datos JSON enviados desde el frontend
    const body: FrequentMedicine = await req.json();

    // Validación: se aseguran los campos mínimos requeridos
    if (!body.userEmail || !body.medicineName || !body.pharmacy || !body.category) {
      return NextResponse.json({ message: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    // Se accede a la colección de medicamentos frecuentes
    const collection = await frequentMedicinesCollection;

    // Se inserta el nuevo medicamento incluyendo slugs y URL de imagen
    await collection.insertOne({
      userEmail: body.userEmail,                // Correo del usuario
      medicineName: body.medicineName,          // Nombre visible del medicamento
      pharmacy: body.pharmacy,                  // Farmacia asociada
      category: body.category,                  // Nombre de la categoría (visible)
      imageUrl: body.imageUrl || null,          // (opcional) URL de la imagen
      medicineSlug: body.medicineSlug || null,  // Slug codificado del medicamento
      categorySlug: body.categorySlug || null,  // Slug codificado de la categoría
      savedAt: new Date()                       // Fecha actual
    });

    // Respuesta de éxito
    return NextResponse.json({ message: 'Medicamento guardado como frecuente.' }, { status: 201 });

  } catch (error) {
    // Registro y respuesta ante errores del servidor
    console.error('Error al guardar medicamento frecuente:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// API que permite obtener los últimos medicamentos frecuentes por usuario
export async function GET(req: NextRequest) {
  try {
    // Se extrae el parámetro "email" desde la URL
    const email = req.nextUrl.searchParams.get('email');

    // Validación: debe venir el email para poder buscar
    if (!email) {
      return NextResponse.json({ message: 'Email no proporcionado.' }, { status: 400 });
    }

    // Se accede a la colección
    const collection = await frequentMedicinesCollection;

    // Se obtienen los últimos 5 medicamentos frecuentes
    const medicines = await collection
      .find({ userEmail: email })
      .sort({ savedAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json(medicines, { status: 200 });

  } catch (error) {
    console.error('Error al obtener medicamentos frecuentes:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
