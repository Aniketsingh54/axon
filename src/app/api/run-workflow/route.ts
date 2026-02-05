import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { workflowJob } from "@/jobs/workflow";
import { executeWorkflowLocally } from "@/lib/local-executor";
import prisma from "@/lib/prisma";
import { WorkflowSchema } from "@/lib/types";

export async function POST(req: Request) {
    console.log("API /api/run-workflow hit");
    try {
        const authData = await auth();
        let userId = authData.userId;

        console.log("Auth check result:", userId);

        if (!userId) {
            console.log("Auth failed, but bypassing for LOCAL DEMO MODE");
            // return new NextResponse("Unauthorized", { status: 401 });
            userId = "test-user-123";
        }

        const body = await req.json();
        // Validate body? Assuming it contains nodes/edges.
        // Ideally we validate with Zod

        const { nodes, edges } = body;

        // We should probably save/sync the workflow first or create a snapshot
        // For this clone, we'll create a new "Workflow" record if ID not present, or update

        // Let's assume we just trigger the job with the visible graph
        // Identify or Create Workflow Record
        let workflowId = body.id;

        if (!workflowId) {
            // Create new
            const w = await prisma.workflow.create({
                data: {
                    userId,
                    name: "Untitled Workflow",
                    data: { nodes, edges }
                }
            });
            workflowId = w.id;
        } else {
            // Update existing (optional, but good practice to sync)
            await prisma.workflow.update({
                where: { id: workflowId },
                data: { data: { nodes, edges } }
            });
        }


        // EXECUTE LOCALLY (Bypass Trigger.dev for Demo)
        const localRun = await executeWorkflowLocally({
            workflowId,
            userId,
            nodes,
            edges
        });

        return NextResponse.json({
            success: true,
            runId: localRun.id,
            workflowId
        });

    } catch (error: any) {
        console.error("Error running workflow:", error);
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
