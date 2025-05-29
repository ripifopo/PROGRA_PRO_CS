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

    // Verifica si ya hay una alerta idéntica
    const exists = await collection.findOne({
      userEmail: data.userEmail,
      medicineName: data.medicineName,
      pharmacy: data.pharmacy
    });

    if (exists) {
      return NextResponse.json({ message: 'Ya existe esta alerta.' }, { status: 409 });
    }

    await collection.insertOne({ ...data, createdAt: new Date().toISOString() });

    return NextResponse.json({ message: 'Alerta creada correctamente.' });
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
