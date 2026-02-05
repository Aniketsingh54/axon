import { useState, useEffect, useRef } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { useReactFlow } from "@xyflow/react";

export function useExecutionPolling(workflowId: string | null) {
    const { setNodeStatus, nodes, setNodes } = useWorkflowStore();
    const { updateNodeData } = useReactFlow();
    const [currentRunId, setCurrentRunId] = useState<string | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Function to start polling (accepts workflowId)
    const startPolling = (workflowId: string) => {
        // We'll poll a special endpoint to find the ACTIVE run for this workflow
        setCurrentRunId("workflow:" + workflowId); // Prefix to distinguish
    };

    useEffect(() => {
        if (!currentRunId) return;

        const poll = async () => {
            try {
                let actualRunId = currentRunId;

                // Resolve Workflow ID to Run ID if needed
                if (currentRunId.startsWith("workflow:")) {
                    const wfId = currentRunId.split(":")[1];
                    const res = await fetch(`/api/workflow/${wfId}/latest-run`);
                    if (!res.ok) return; // Maybe no run yet
                    const run = await res.json();
                    if (run && run.id) {
                        // Found the run, switch to polling that specific run
                        // But we can just use the ID for the next call
                        actualRunId = run.id;
                    } else {
                        return; // Wait for run to appear
                    }
                }

                const res = await fetch(`/api/runs/${actualRunId}`);
                if (!res.ok) return;

                const data = await res.json();
                const { status, executions } = data;

                // Update Node Statuses
                if (executions) {
                    executions.forEach((exec: any) => {
                        setNodeStatus(exec.nodeId, exec.status === "RUNNING" ? "running" : exec.status === "SUCCESS" ? "success" : exec.status === "ERROR" ? "error" : "idle");

                        // Update Node Data with Outputs if Success
                        if (exec.status === "SUCCESS" && exec.outputs) {
                            // We need to be careful not to overwrite user input if it's an input node
                            // But for LLM/Media nodes, we want to show the output.

                            // Logic: Update 'output' field in data
                            // We directly update React Flow nodes via hook
                            updateNodeData(exec.nodeId, { ...exec.outputs });
                        }
                    });
                }

                if (status === "COMPLETED" || status === "FAILED") {
                    // Stop polling
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setCurrentRunId(null);
                }

            } catch (error) {
                console.error("Polling error", error);
            }
        };

        // Poll every 1s
        pollingRef.current = setInterval(poll, 1000);
        poll(); // Initial call

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [currentRunId, setNodeStatus, updateNodeData]);

    return { startPolling, isPolling: !!currentRunId };
}
