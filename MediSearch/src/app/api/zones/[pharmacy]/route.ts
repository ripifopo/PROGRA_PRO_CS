// Archivo: src/app/api/zones/[pharmacy]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET(req: NextRequest) {
  try {
    // Extraer el nombre de la farmacia desde la URL
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const pharmacy = segments[segments.length - 1];

    // Normalizar nombre del archivo
    const fileName = `${pharmacy.toLowerCase().replace(/\s/g, '')}_stock_locations.json`;

    // Construir ruta del archivo dentro de /public/stock/zones/
    const filePath = path.join(process.cwd(), 'public', 'stock', 'zones', fileName);

    // Leer contenido
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(fileContent);

    return NextResponse.json(json);
  } catch (err) {
    console.error('❌ Error leyendo JSON:', err);
    return NextResponse.json({ error: 'Error al leer JSON' }, { status: 500 });
  }
}
