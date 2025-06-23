// Archivo: src/app/api/zones/[pharmacy]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET(req: NextRequest, { params }: { params: { pharmacy: string } }) {
  try {
    const { pharmacy } = params;
    const fileName = `${pharmacy.toLowerCase().replace(/\s/g, '')}_stock_locations.json`;

    const filePath = path.join(process.cwd(), 'public', 'stock', 'zones', fileName);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(fileContent);

    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: 'Error al leer JSON' }, { status: 500 });
  }
}
