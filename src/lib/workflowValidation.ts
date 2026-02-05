import { Edge, Node, getOutgoers } from "@xyflow/react";

export function validateConnection(connection: any, nodes: Node[], edges: Edge[]) {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    // 1. Prevent connecting to self
    if (sourceNode.id === targetNode.id) return false;

    // 2. Type Safety Logic (Basic)
    // Image handles should only connect to image inputs, etc.
    // This logic depends on handle IDs having semantic names like "image", "video", "text"

    // Custom Logic Examples:
    // - ImageUploadNode (output) -> connects to CropNode (image_url) or LLMNode (images)
    // - VideoUploadNode (output) -> connects to FrameExtractNode (video_url)
    // - TextNode (output) -> connects to LLMNode (system_prompt, user_message)

    // We can enforce this if handle IDs match types.
    const sourceHandle = connection.sourceHandle; // e.g., "output"
    const targetHandle = connection.targetHandle; // e.g., "image_url", "system_prompt"

    // If we can't infer type from handle, we might look at node types.

    // E.g. VideoUploadNode output -> target handle MUST be "video_url"
    if (sourceNode.type === 'videoUploadNode') {
        if (targetHandle !== 'video_url') return false;
    }

    // E.g. ImageUploadNode output -> target handle MUST be "image_url" or "images"
    if (sourceNode.type === 'imageUploadNode') {
        if (!['image_url', 'images'].includes(targetHandle)) return false;
    }

    // 3. Cycle Detection
    const targetOutgoers = getOutgoers(targetNode, nodes, edges);
    if (hasPath(targetNode, sourceNode, nodes, edges)) {
        return false; // Cycle detected
    }

    return true;
}

function hasPath(node: Node, target: Node, nodes: Node[], edges: Edge[], visited = new Set()) {
    if (visited.has(node.id)) return false;
    visited.add(node.id);

    if (node.id === target.id) return true;

    const outgoers = getOutgoers(node, nodes, edges);
    for (const outgoer of outgoers) {
        if (hasPath(outgoer, target, nodes, edges, visited)) {
            return true;
        }
    }

    return false;
}
