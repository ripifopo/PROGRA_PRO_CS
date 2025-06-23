// Archivo: src/app/api/zones/[pharmacy]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Record<string, string> } // ✅ Esta es la forma que sí acepta Vercel
) {
  try {
    const slug = params.pharmacy.toLowerCase().replace(/\s/g, '');
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/stock/zones/${slug}_stock_locations.json`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Archivo no encontrado');

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('❌ Error en /api/zones/[pharmacy]:', err);
    return NextResponse.json({ error: 'Error al leer JSON' }, { status: 500 });
  }
}
