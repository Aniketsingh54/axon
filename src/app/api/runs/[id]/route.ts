import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
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
