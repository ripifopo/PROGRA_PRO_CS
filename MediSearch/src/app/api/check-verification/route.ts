import { NextRequest, NextResponse } from "next/server";
import { verifiedUsersCollection } from "@/lib/mongodb";

// API que revisa si el usuario está verificado en la base de datos
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email es requerido." }, { status: 400 });
  }

  // Buscamos el email en la colección de usuarios verificados
  const user = await verifiedUsersCollection.findOne({ email });

  // Si no existe el usuario, devolvemos falso (no verificado)
  if (!user) {
    return NextResponse.json({ verified: false }, { status: 200 });
  }

  // Devolvemos el estado de verificación real
  return NextResponse.json({ verified: user.verified }, { status: 200 });
}
