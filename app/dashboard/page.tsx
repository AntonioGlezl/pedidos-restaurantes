import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function DashboardPage() {
    const session = await auth();
    const restaurant = await db.restaurant.findUnique({
        where: { userId: session!.user.id },
    });

    return (
        <section className="flex items-center justify-between flex-col">
            <div>
                <h1 className="text-2xl font-bold">{restaurant?.name}</h1>
                <p className="mt-2 text-gray-600">
                    Tu página pública:{" "}
                    <Link className="underline" href={`/${restaurant?.slug}`}>
                        /{restaurant?.slug}
                    </Link>
                </p>
            </div>
            <div className="">
                <Link href="/dashboard/menu" className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
                    Gestionar carta
                </Link>
                <Link href="/dashboard/schedule" className="mt-4 ml-2 inline-block rounded-md border px-4 py-2 text-sm font-medium">
                    Horarios de recogida
                </Link>
            </div>
        </section>
    );
}