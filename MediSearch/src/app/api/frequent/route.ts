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

    // Se inserta el nuevo medicamento en la base de datos con fecha de guardado
    await collection.insertOne({
      userEmail: body.userEmail,
      medicineName: body.medicineName,
      pharmacy: body.pharmacy,
      category: body.category,
      savedAt: new Date()
    });

    // Respuesta exitosa
    return NextResponse.json({ message: 'Medicamento guardado como frecuente.' }, { status: 201 });

  } catch (error) {
    // Registro y respuesta ante errores del servidor
    console.error('Error al guardar medicamento frecuente:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
