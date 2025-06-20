import { NextRequest, NextResponse } from 'next/server';
import { priceHistoryCollection } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    // 🟢 Extrae el ID desde la URL
    const idStr = req.nextUrl.pathname.split('/').pop();
    const medicineId = parseInt(idStr || '');
    const pharmacy = decodeURIComponent(req.nextUrl.searchParams.get('pharmacy') || '');
    const name = decodeURIComponent(req.nextUrl.searchParams.get('name') || '').toLowerCase();

    if (!pharmacy || isNaN(medicineId)) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const doc = await (await priceHistoryCollection).findOne({ pharmacy });
    if (!doc || !doc.snapshots) return NextResponse.json([]);

    const results: { date: string; offer_price: number; normal_price: number }[] = [];

    for (const [date, categories] of Object.entries(doc.snapshots)) {
      for (const category of Object.values(categories as any)) {
        const items = category as any[];

        // 🟢 Intenta buscar por ID
        let product = items.find((p) => p.id === medicineId);

        // 🔁 Si no lo encuentra por ID, intenta buscar por nombre
        if (!product && name) {
          product = items.find((p) => p.name?.toLowerCase() === name);
        }

        if (product) {
          results.push({
            date,
            offer_price: parseInt(product.offer_price?.replace(/[^0-9]/g, '') || '0'),
            normal_price: parseInt(product.normal_price?.replace(/[^0-9]/g, '') || '0'),
          });
        }
      }
    }

    results.sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json(results);
  } catch (error) {
    console.error('❌ Error en /api/history/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
