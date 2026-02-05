import { NextResponse } from "next/server";
import { getWorkflowRuns } from "@/lib/history";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const runs = await getWorkflowRuns(params.id);
        return NextResponse.json(runs);
    } catch (error: any) {
        return new NextResponse(error.message, { status: 500 });
    }
}
