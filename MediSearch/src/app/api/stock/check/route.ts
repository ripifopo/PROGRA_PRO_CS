// ✅ Archivo: src/app/api/stock/check/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { url, comuna } = await req.json();

    if (!url || !comuna) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: url y comuna' },
        { status: 400 }
      );
    }

    const scriptPath = path.resolve(process.cwd(), 'src/stock/stock_checker.py');

    return new Promise((resolve) => {
      const child = spawn('python', [scriptPath, url, comuna], {
        cwd: path.join(process.cwd(), 'src', 'stock'),
        env: {
          ...process.env,
          PYTHONPATH: path.join(process.cwd(), 'src')
        }
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        const cleanedOutput = output.trim();
        const cleanedError = errorOutput.trim();

        if (code === 0 && cleanedOutput) {
          resolve(
            NextResponse.json({ success: true, stock: cleanedOutput }, { status: 200 })
          );
        } else {
          console.error('[ERROR][stock_checker]', cleanedError || 'No error output');
          resolve(
            NextResponse.json({
              success: false,
              error: cleanedError || 'El verificador no devolvió resultado.',
            }, { status: 500 })
          );
        }
      });
    });
  } catch (error: any) {
    console.error('[API][stock/check]', error);
    return NextResponse.json({
      success: false,
      error: 'Error inesperado en el servidor',
    }, { status: 500 });
  }
}
