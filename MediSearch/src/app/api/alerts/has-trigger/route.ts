// src/app/api/alerts/has-trigger/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { alertsCollection } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ hasTrigger: false });

    const alerts = await alertsCollection;
    const count = await alerts.countDocuments({ userEmail: email, triggered: true });

    return NextResponse.json({ hasTrigger: count > 0 });
  } catch (err) {
    return NextResponse.json({ hasTrigger: false });
  }
}
