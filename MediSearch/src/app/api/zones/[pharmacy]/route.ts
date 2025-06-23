// Archivo: src/app/api/zones/[pharmacy]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { NextApiRequest } from 'next';
import type { Params } from 'next/dist/shared/lib/router/utils/route-matcher'; // ✨ tipo correcto

export async function GET(
  _req: NextRequest,
  context: { params: Params } // ✅ este es el tipo correcto
) {
  try {
    const { pharmacy } = context.params;
    const slug = pharmacy.toLowerCase().replace(/\s/g, '');

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
