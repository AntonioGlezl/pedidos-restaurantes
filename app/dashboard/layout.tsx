import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className=" w-1/2 mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/dashboard">Resumen</Link>
          <Link href="/dashboard/orders">Pedidos</Link>
          <Link href="/dashboard/menu">Carta</Link>
          <Link href="/dashboard/schedule">Horarios</Link>
          <Link href="/dashboard/page-settings">Mi página</Link>
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="cursor-pointer text-sm underline">Cerrar sesión</button>
        </form>
      </header>
      {children}
    </div>
  );
}