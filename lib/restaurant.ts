import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function requireRestaurant() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const restaurant = await db.restaurant.findUnique({
    where: { userId: session.user.id },
  });
  if (!restaurant) redirect("/login");

  return restaurant;
}