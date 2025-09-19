import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: NextResponse) {
  const user = await currentUser();

  try {
    const users = await db
      .select()
      .from(usersTable)
      // @ts-ignore
      .where(eq(usersTable.email, user?.emailAddresses[0].emailAddress));

    if (users.length === 0) {
      const result = await db
        .insert(usersTable)
        .values({
          // @ts-ignore
          name: user?.fullName,
          email: user?.emailAddresses[0].emailAddress,
          credit: 10,
        })
        // @ts-ignore
        .returning({ usersTable });
      return NextResponse.json(result[0]?.usersTable);
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    return NextResponse.json(error);
  }
}
