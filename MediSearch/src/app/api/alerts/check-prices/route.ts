import { NextRequest, NextResponse } from 'next/server';
import { alertsCollection, medicinesCollection } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expected) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const alerts = await alertsCollection;
    const medicines = await medicinesCollection;

    const allAlerts = await alerts.find({}).toArray();
    const allPharmacies = await medicines.find({}).toArray();

    let updatedCount = 0;

    for (const alert of allAlerts) {
      let foundMedicine = null;

      // 🔍 Buscar medicamento por ID en todas las farmacias y categorías
      for (const pharmacyDoc of allPharmacies) {
        for (const categoryArray of Object.values(pharmacyDoc.categories || {})) {
          for (const med of categoryArray as any[]) {
            if (med.id === alert.medicineId) {
              foundMedicine = med;
              break;
            }
          }
          if (foundMedicine) break;
        }
        if (foundMedicine) break;
      }

      if (!foundMedicine) continue;

      // 💰 Precios limpios y forzados a número
      const newPrice = parseInt(foundMedicine.offer_price?.toString().replace(/[^\d]/g, '') || '0');

      const oldPriceRaw =
        typeof alert.lastKnownPrice === 'number'
          ? alert.lastKnownPrice
          : parseInt(alert.lastKnownPrice?.toString().replace(/[^\d]/g, '') || '999999');

      const oldPrice = isNaN(oldPriceRaw) ? 999999 : oldPriceRaw;

      // ✅ Si el precio bajó, actualizar alerta y activar campanita
      if (newPrice > 0 && newPrice < oldPrice) {
        await alerts.updateOne(
          { _id: alert._id },
          {
            $set: {
              lastKnownPrice: Number(newPrice), // 🔧 tipo numérico obligatorio
              triggered: true
            }
          }
        );
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
    });
  } catch (error) {
    console.error('[ERROR][check-prices]', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al revisar precios' },
      { status: 500 }
    );
  }
}
