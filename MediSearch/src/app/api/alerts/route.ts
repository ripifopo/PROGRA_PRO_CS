// Archivo: src/app/api/alerts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { alertsCollection } from '../../../lib/mongodb.ts';
import { ObjectId } from 'mongodb';
import { Alert } from '../../../lib/models/Alerts.ts';

// GET → Retorna todas las alertas registradas por un usuario
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Falta el correo.' }, { status: 400 });
    }

    const collection = await alertsCollection;
    const alerts = await collection.find({ userEmail: email }).toArray();

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('[GET ALERTS ERROR]', error);
    return NextResponse.json({ message: 'Error interno.' }, { status: 500 });
  }
}

// POST → Registra una nueva alerta si no está duplicada
export async function POST(req: NextRequest) {
  try {
    const data: Alert = await req.json();
    const collection = await alertsCollection;

    if (!data.userEmail || !data.medicineId || !data.pharmacy || !data.category) {
      return NextResponse.json({ message: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    const exists = await collection.findOne({
      userEmail: data.userEmail,
      medicineId: data.medicineId,
      pharmacy: data.pharmacy
    });

    if (exists) {
      return NextResponse.json({ message: 'Ya existe esta alerta.' }, { status: 409 });
    }

    // ⚠️ Extra: si no viene el precio, se pone un valor muy alto como predeterminado
    const lastKnown = data.lastKnownPrice || '999999';

    await collection.insertOne({
      userEmail: data.userEmail,
      medicineId: data.medicineId,
      medicineName: data.medicineName || null,
      pharmacy: data.pharmacy,
      category: data.category,
      medicineSlug: data.medicineSlug || null,
      categorySlug: data.categorySlug || null,
      pharmacyUrl: data.pharmacyUrl || null,
      imageUrl: data.imageUrl || null,
      bioequivalent: data.bioequivalent || 'false',
      lastKnownPrice: lastKnown, // ✅ precio guardado como string
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Alerta creada correctamente.' }, { status: 201 });

  } catch (error) {
    console.error('[POST ALERT ERROR]', error);
    return NextResponse.json({ message: 'Error al crear alerta.' }, { status: 500 });
  }
}

// DELETE → Elimina una alerta según su ID recibido por query
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID no válido o no proporcionado.' }, { status: 400 });
    }

    const collection = await alertsCollection;
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: 'Alerta eliminada correctamente.' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Alerta no encontrada.' }, { status: 404 });
    }
  } catch (error) {
    console.error('[DELETE ALERT ERROR]', error);
    return NextResponse.json({ message: 'Error al eliminar alerta.' }, { status: 500 });
  }
}
