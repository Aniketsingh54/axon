import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const run = await prisma.workflowRun.findUnique({
            where: { id },
            include: { executions: true }
        });

        if (!run) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(run);
    } catch (error: any) {
        return new NextResponse(error.message, { status: 500 });
    }
}
