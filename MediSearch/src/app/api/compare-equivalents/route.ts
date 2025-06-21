import { NextRequest, NextResponse } from 'next/server';
import { medicinesCollection } from '@/lib/mongodb';
import { normalizeCategoryName } from '@/lib/utils/normalizeCategories';

export async function GET(req: NextRequest) {
  try {
    const idStr = req.nextUrl.searchParams.get('id');
    if (!idStr) return NextResponse.json({ medicines: [] }, { status: 400 });

    const id = Number(idStr);
    if (isNaN(id)) return NextResponse.json({ medicines: [] }, { status: 400 });

    const collection = await medicinesCollection;
    const original = await collection.findOne({ medicineId: id });

    if (!original) return NextResponse.json({ medicines: [] }, { status: 404 });

    const normalizedCategory = normalizeCategoryName(original.category);

    // Buscar hasta 3 medicamentos de la misma categoría, excluyendo el original
    const candidates = await collection.find({
      category: { $regex: new RegExp(normalizedCategory, 'i') },
      medicineId: { $ne: id },
    }).limit(3).toArray();

    return NextResponse.json({ medicines: candidates });
  } catch (error) {
    console.error('Error en compare-equivalents:', error);
    return NextResponse.json({ medicines: [] }, { status: 500 });
  }
}
