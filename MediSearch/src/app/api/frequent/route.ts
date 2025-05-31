// Archivo: src/app/api/frequent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { frequentMedicinesCollection } from '../../../lib/mongodb.ts';
import { FrequentMedicine } from '../../../lib/models/FrequentMedicine.ts';
import { ObjectId } from 'mongodb';

// POST: Guarda un nuevo medicamento frecuente
export async function POST(req: NextRequest) {
  try {
    const body: FrequentMedicine = await req.json();

    // Validación mínima requerida
    if (!body.userEmail || !body.medicineId || !body.pharmacy || !body.category) {
      return NextResponse.json({ message: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    const collection = await frequentMedicinesCollection;

    // Verifica si ya existe este medicamento para ese usuario por ID
    const exists = await collection.findOne({
      userEmail: body.userEmail,
      medicineId: body.medicineId,
      pharmacy: body.pharmacy
    });

    if (exists) {
      return NextResponse.json({ message: 'Ya has guardado este medicamento.' }, { status: 409 });
    }

    // Inserta el nuevo medicamento frecuente
    await collection.insertOne({
      userEmail: body.userEmail,
      medicineId: body.medicineId,
      medicineName: body.medicineName || null,
      pharmacy: body.pharmacy,
      category: body.category,
      imageUrl: body.imageUrl || null,
      medicineSlug: body.medicineSlug || null,
      categorySlug: body.categorySlug || null,
      pharmacyUrl: body.pharmacyUrl || null,
      savedAt: new Date()
    });

    return NextResponse.json({ message: 'Medicamento guardado como frecuente.' }, { status: 201 });

  } catch (error) {
    console.error('Error al guardar medicamento frecuente:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET: Obtiene los medicamentos frecuentes por email
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ message: 'Email no proporcionado.' }, { status: 400 });
    }

    const collection = await frequentMedicinesCollection;
    const medicines = await collection
      .find({ userEmail: email })
      .sort({ savedAt: -1 })
      .toArray();

    return NextResponse.json(medicines, { status: 200 });

  } catch (error) {
    console.error('Error al obtener medicamentos frecuentes:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Elimina un medicamento frecuente por ID del documento
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'ID no proporcionado.' }, { status: 400 });
    }

    const collection = await frequentMedicinesCollection;
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: 'Medicamento eliminado correctamente.' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Medicamento no encontrado.' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error al eliminar medicamento frecuente:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
