import { NextRequest, NextResponse } from "next/server";
import { verifiedUsersCollection } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token inválido o faltante." }, { status: 400 });
  }

  const user = await verifiedUsersCollection.findOne({ verificationToken: token });

  if (!user) {
    return NextResponse.json({ error: "Token no encontrado o expirado." }, { status: 404 });
  }

  // Actualizamos el usuario como verificado
  await verifiedUsersCollection.updateOne(
    { verificationToken: token },
    {
      $set: { verified: true, verifiedAt: new Date() },
      $unset: { verificationToken: "" }
    }
  );

  // 🚀 Redirigimos directo a la página de alerts
  return NextResponse.redirect(`${process.env.BASE_URL}/alerts`);
}
