import { NextResponse } from "next/server";
import { getWorkflowRuns } from "@/lib/history";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const runs = await getWorkflowRuns(id);
        return NextResponse.json(runs);
    } catch (error: any) {
        return new NextResponse(error.message, { status: 500 });
    }
}
