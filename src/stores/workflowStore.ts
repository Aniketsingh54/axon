import { create } from "zustand";
import { temporal, type TemporalState } from "zundo";
import {
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
} from "@xyflow/react";
import { validateConnection } from "@/lib/workflowValidation";

interface WorkflowState {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    // Execution state
    nodeExecutionStatus: Record<string, "idle" | "running" | "success" | "error">;
    setNodeStatus: (nodeId: string, status: "idle" | "running" | "success" | "error") => void;
    setWorkflow: (nodes: Node[], edges: Edge[]) => void;
}

export const useWorkflowStore = create<WorkflowState>()(
    temporal((set, get) => ({
        nodes: [],
        edges: [],
        onNodesChange: (changes) => {
            set({
                nodes: applyNodeChanges(changes, get().nodes),
            });
        },
        onEdgesChange: (changes) => {
            set({
                edges: applyEdgeChanges(changes, get().edges),
            });
        },
        onConnect: (connection) => {
            const { nodes, edges } = get();
            const isValid = validateConnection(connection, nodes, edges);

            if (isValid) {
                set({
                    edges: addEdge({ ...connection, type: "animatedPurple", animated: true }, get().edges),
                });
            }
        },
        setNodes: (nodes) => set({ nodes }),
        setEdges: (edges) => set({ edges }),

        nodeExecutionStatus: {},
        setNodeStatus: (nodeId, status) =>
            set((state) => ({
                nodeExecutionStatus: {
                    ...state.nodeExecutionStatus,
                    [nodeId]: status,
                },
            })),
        setWorkflow: (nodes, edges) => set({ nodes, edges }),
    }))
);
