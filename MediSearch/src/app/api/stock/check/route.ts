// ✅ Archivo: src/app/api/stock/check/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { url, comuna } = await req.json();

    if (!url || !comuna) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: url y comuna' },
        { status: 400 }
      );
    }

    const scriptPath = path.resolve(process.cwd(), 'src/stock/stock_checker.py');

    return new Promise<Response>((resolve) => {
      const child = spawn('python', [scriptPath, url, comuna], {
        cwd: path.join(process.cwd(), 'src', 'stock'),
        env: {
          ...process.env,
          PYTHONPATH: path.join(process.cwd(), 'src')
        }
      });

      let result = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        result += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(
            NextResponse.json({ success: true, stock: result.trim() }, { status: 200 })
          );
        } else {
          console.error('[ERROR][stock_checker]', errorOutput);
          resolve(
            NextResponse.json({ success: false, error: 'Error al ejecutar el verificador de stock' }, { status: 500 })
          );
        }
      });
    });

  } catch (error) {
    console.error('[API][stock/check]', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
