"use client";

import { useCallback, useState } from "react";
import { Background, Controls, ReactFlow, MiniMap, BackgroundVariant, type Node, type Edge, useReactFlow, ReactFlowProvider, Panel } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowStore } from "@/stores/workflowStore";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import { TextNode } from "@/components/nodes/TextNode";
import { ImageUploadNode } from "@/components/nodes/ImageUploadNode";
import { VideoUploadNode } from "@/components/nodes/VideoUploadNode";
import { LLMNode } from "@/components/nodes/LLMNode";
import { CropNode } from "@/components/nodes/CropNode";
import { FrameExtractNode } from "@/components/nodes/FrameExtractNode";
import { AnimatedPurpleEdge } from "@/components/edges/AnimatedPurpleEdge";
import { SAMPLE_WORKFLOW } from "@/lib/sample-data";

const nodeTypes = {
    textNode: TextNode,
    imageUploadNode: ImageUploadNode,
    videoUploadNode: VideoUploadNode,
    llmNode: LLMNode,
    cropNode: CropNode,
    frameExtractNode: FrameExtractNode,
};

const edgeTypes = {
    animatedPurple: AnimatedPurpleEdge,
};

import { useExecutionPolling } from "@/hooks/useExecutionPolling";

function CanvasContent() {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes } = useWorkflowStore();
    const { screenToFlowPosition } = useReactFlow();
    const [isRunning, setIsRunning] = useState(false);
    const { getToken } = useAuth();

    // We assume we have a workflow ID context or prop, but for clone we use null init then startPolling(id)
    const { startPolling } = useExecutionPolling(null);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: crypto.randomUUID(),
                type,
                position,
                data: { label: `${type}` },
            };

            setNodes([...nodes, newNode]);
        },
        [screenToFlowPosition, nodes, setNodes],
    );

    const handleRun = async () => {
        setIsRunning(true);
        try {
            const response = await fetch("/api/run-workflow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nodes, edges })
            });

            if (!response.ok) throw new Error("Failed to start run");

            const data = await response.json();
            console.log("Run started:", data);

            if (data.workflowId) {
                startPolling(data.workflowId);
            }

            alert("Workflow Run Started! Watch nodes for progress.");
        } catch (error) {
            console.error(error);
            alert("Error running workflow");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="h-full w-full bg-slate-50 dark:bg-slate-950">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{ type: "animatedPurple", animated: true }}
                fitView
            >
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <Controls />
                <MiniMap />
                <Panel position="top-right" className="m-4 flex gap-2">
                    <Button variant="outline" onClick={() => {
                        const { setWorkflow } = useWorkflowStore.getState();
                        setWorkflow(SAMPLE_WORKFLOW.nodes, SAMPLE_WORKFLOW.edges);
                    }}>
                        Load Sample
                    </Button>
                    <Button onClick={handleRun} disabled={isRunning} className="gap-2 bg-purple-600 hover:bg-purple-700">
                        <Play className="h-4 w-4" />
                        {isRunning ? "Running..." : "Run Workflow"}
                    </Button>
                </Panel>
            </ReactFlow>
        </div>
    );
}

export function Canvas() {
    return (
        <ReactFlowProvider>
            <CanvasContent />
        </ReactFlowProvider>
    );
}
