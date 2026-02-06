import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getLatestRun } from "@/lib/history";

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const workflowId = id;
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
