import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className=" w-1/2 mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold hover:underline">Panel</Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-sm hover:underline">Cerrar sesión</button>
        </form>
      </header>
      {children}
    </div>
  );
}