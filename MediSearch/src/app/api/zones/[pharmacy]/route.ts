// Archivo: src/app/api/zones/[pharmacy]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Extrae el parámetro dinámico manualmente desde la URL
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const pharmacySlug = segments[segments.length - 1]; // obtiene 'ahumada', etc.

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const jsonUrl = `${baseUrl}/stock/zones/${pharmacySlug}_stock_locations.json`;

    const res = await fetch(jsonUrl);
    if (!res.ok) throw new Error('Archivo no encontrado');

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('❌ Error en /api/zones/[pharmacy]:', err);
    return NextResponse.json({ error: 'Error al leer JSON' }, { status: 500 });
  }
}
