import { NextRequest, NextResponse } from 'next/server';
import { alertsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Falta el ID de la alerta' }, { status: 400 });
    }

    const alerts = await alertsCollection;

    const result = await alerts.updateOne(
      { _id: new ObjectId(id) },
      { $set: { triggered: false } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, error: 'No se encontró la alerta o ya estaba desactivada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ERROR][disable-trigger]', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al desactivar trigger' },
      { status: 500 }
    );
  }
}
