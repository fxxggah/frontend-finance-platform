import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Invalida e remove o cookie de sessão do navegador.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("fin_session");

  return NextResponse.json({ success: true });
}

