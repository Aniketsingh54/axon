import { Edge, Node } from "@xyflow/react";

export type ExecutionPlan = {
    levels: string[][]; // Array of arrays of nodeIds to run in parallel
};

export function buildExecutionPlan(nodes: Node[], edges: Edge[]): ExecutionPlan {
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    nodes.forEach((node) => {
        adjList.set(node.id, []);
        inDegree.set(node.id, 0);
    });

    // Build Graph
    edges.forEach((edge) => {
        const source = edge.source;
        const target = edge.target;

        if (adjList.has(source) && adjList.has(target)) {
            adjList.get(source)!.push(target);
            inDegree.set(target, (inDegree.get(target) || 0) + 1);
        }
    });

    // Kahn's Algorithm for Topological Sort with Levels (for parallelism)
    const queue: string[] = [];
    const levels: string[][] = [];

    // Find 0 in-degree nodes (starters)
    nodes.forEach((node) => {
        if ((inDegree.get(node.id) || 0) === 0) {
            queue.push(node.id);
        }
    });

    let processedCount = 0;

    // Create copies for simulation
    const currentInDegree = new Map(inDegree);
    let currentLevelQueue = [...queue];

    while (currentLevelQueue.length > 0) {
        levels.push([...currentLevelQueue]);
        const nextLevelQueue: string[] = [];

        for (const nodeId of currentLevelQueue) {
            processedCount++;
            const neighbors = adjList.get(nodeId) || [];

            for (const neighbor of neighbors) {
                currentInDegree.set(neighbor, (currentInDegree.get(neighbor)! - 1));
                if (currentInDegree.get(neighbor) === 0) {
                    nextLevelQueue.push(neighbor);
                }
            }
        }
        currentLevelQueue = nextLevelQueue;
    }

    if (processedCount !== nodes.length) {
        throw new Error("Cycle detected in workflow");
    }

    return { levels };
}

export function getDependingNodes(nodeId: string, nodes: Node[], edges: Edge[]): string[] {
    const outgoers = edges.filter(e => e.source === nodeId).map(e => e.target);
    return outgoers;
}

export function getInputValues(nodeId: string, edges: Edge[], nodeOutputs: Record<string, any>) {
    // Find all edges connecting TO this node
    const incomingEdges = edges.filter(e => e.target === nodeId);
    const inputs: Record<string, any> = {};

    incomingEdges.forEach(edge => {
        const sourceNodeId = edge.source;
        // Map source output to target handle
        // Assuming simple single output for now or using handle mapping
        // If source has multiple outputs, we need explicit handle logic

        // For this clone, we grab the whole output object from source
        const sourceOutput = nodeOutputs[sourceNodeId];

        // Map to specific input key if handle provides it?
        // E.g. edge.targetHandle might be "image_url"
        if (edge.targetHandle && sourceOutput) {
            // If sourceOutput is an object, we might need to extract specific field?
            // Or if sourceOutput is primitive (URL string), assign it.

            // Heuristic for Clone:
            // If edge.sourceHandle is "output" and sourceOutput is { text: ... } or just string?

            // Let's assume passed data is flattened or we pass specific keys
            if (typeof sourceOutput === 'object' && sourceOutput !== null) {
                // Try to match standard keys
                if (edge.targetHandle === 'image_url' && sourceOutput.imageUrl) inputs['image_url'] = sourceOutput.imageUrl;
                else if (edge.targetHandle === 'video_url' && sourceOutput.videoUrl) inputs['video_url'] = sourceOutput.videoUrl;
                else if (edge.targetHandle === 'system_prompt') inputs['system_prompt'] = sourceOutput.text || sourceOutput.output;
                else if (edge.targetHandle === 'user_message') inputs['user_message'] = sourceOutput.text || sourceOutput.output;
                else {
                    // Fallback: just pass it
                    inputs[edge.targetHandle] = sourceOutput;
                }
            } else {
                inputs[edge.targetHandle] = sourceOutput;
            }
        }
    });
    return inputs;
}
