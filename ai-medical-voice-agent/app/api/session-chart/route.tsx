import { db } from "@/config/db";
import { SessionChartTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { notes, selectedDoctor } = await req.json();
    const user = await currentUser();
    const sessionId = uuidv4();
    const result = await db
      .insert(SessionChartTable)
      .values({
        sessionId,
        notes,
        selectedDoctor,
        createdBy: user?.emailAddresses[0].emailAddress,
        createdOn: new Date().toString(),
      })
      // @ts-ignore
      .returning({ SessionChartTable });
    return NextResponse.json(result[0]?.SessionChartTable);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
