import { NextRequest, NextResponse } from 'next/server';
import { alertsCollection, medicinesCollection } from '@/lib/mongodb';
import sendEmail from '@/lib/email/sendEmail';

export const dynamic = 'force-dynamic'; // Para que el cron funcione correctamente

export async function GET(req: NextRequest) {
  // 🔐 Verificación del token de seguridad
  const authHeader = req.headers.get('Authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expected) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const alerts = await alertsCollection;
    const medicines = await medicinesCollection;

    const allAlerts = await alerts.find({}).toArray();
    const allMedicines = await medicines.find({}).toArray();

    const notificationsSent: string[] = [];

    for (const alert of allAlerts) {
      const medicine = allMedicines.find(m => m.medicineId === alert.medicineId);
      if (!medicine) continue;

      const newPrice = parseInt(medicine.offer_price?.replace(/[^0-9]/g, '') || '0');
      const oldPrice = parseInt(alert.lastKnownPrice || '999999');

      if (newPrice < oldPrice && newPrice > 0) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #2a9d8f; text-align: center;">💊 ¡Tu medicamento bajó de precio!</h2>
            <p style="font-size: 16px; color: #333333; margin-top: 24px;">
              Hemos detectado una baja en el precio del medicamento <strong style="color: #2a9d8f;">${medicine.name}</strong>.
            </p>

            <table style="width: 100%; margin-top: 16px; font-size: 16px;">
              <tr>
                <td><strong>Precio anterior:</strong></td>
                <td style="text-decoration: line-through; color: #888;">$${oldPrice}</td>
              </tr>
              <tr>
                <td><strong>Precio actual:</strong></td>
                <td style="color: #e63946; font-weight: bold;">$${newPrice}</td>
              </tr>
              <tr>
                <td><strong>Farmacia:</strong></td>
                <td>${medicine.pharmacy || 'Desconocida'}</td>
              </tr>
            </table>

            <div style="text-align: center; margin: 32px 0;">
              <a href="https://pharmasearch.vercel.app/comparator/categories/${encodeURIComponent(medicine.category)}/${medicine.medicineId}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #2a9d8f; color: white; text-decoration: none; font-weight: bold; border-radius: 8px;">
                 🔍 Ver Medicamento
              </a>
            </div>

            <p style="font-size: 14px; color: #999; text-align: center;">
              Este correo fue enviado automáticamente por <strong>PharmaSearch</strong>. Si ya no deseas recibir alertas, puedes gestionarlas desde tu perfil.
            </p>
          </div>
        `;

        await sendEmail({
          to: alert.userEmail,
          subject: 'Tu medicamento bajó de precio',
          html
        });

        notificationsSent.push(alert.userEmail);

        await alerts.updateOne(
          { _id: alert._id },
          { $set: { lastKnownPrice: newPrice } }
        );
      }
    }

    return NextResponse.json({ success: true, updated: notificationsSent.length });
  } catch (error) {
    console.error('[ERROR][check-prices]', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al revisar precios' },
      { status: 500 }
    );
  }
}
