import prisma from "@/lib/prisma";

export async function getWorkflowRuns(workflowId: string) {
    return await prisma.workflowRun.findMany({
        where: { workflowId },
        orderBy: { triggeredAt: 'desc' },
        include: {
            executions: true
        }
    });
}

export async function getLatestRun(workflowId: string) {
    return await prisma.workflowRun.findFirst({
        where: { workflowId },
        orderBy: { triggeredAt: 'desc' },
        include: {
            executions: true
        }
    });
}
