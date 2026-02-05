import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getLatestRun } from "@/lib/history";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const workflowId = params.id;
        const run = await getLatestRun(workflowId);

        if (!run) {
            // Return null or empty JSON instead of 404 to avoid errors in polling
            return NextResponse.json({});
        }

        return NextResponse.json(run);
    } catch (error: any) {
        return new NextResponse(error.message, { status: 500 });
    }
}
