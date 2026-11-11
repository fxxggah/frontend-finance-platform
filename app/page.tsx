import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("fin_session");

  if (sessionCookie?.value) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
