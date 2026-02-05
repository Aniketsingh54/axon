export async function fetchWorkflowRuns(workflowId: string) {
    // Assuming backend endpoint /api/workflow/[id]/runs
    // We already have /api/runs/[id] for single run
    // Let's make /api/workflow/[id]/runs
    const res = await fetch(`/api/workflow/${workflowId}/runs`);
    if (!res.ok) throw new Error("Failed to fetch runs");
    return res.json();
}
