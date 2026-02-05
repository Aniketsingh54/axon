import { Edge, Node } from "@xyflow/react";

export const SAMPLE_WORKFLOW: { nodes: Node[]; edges: Edge[] } = {
    nodes: [
        {
            id: "media-upload-1",
            type: "imageUploadNode",
            position: { x: 100, y: 100 },
            data: { label: "Product Photo", imageUrl: "" },
        },
        {
            id: "crop-1",
            type: "cropNode",
            position: { x: 400, y: 100 },
            data: { label: "Square Crop" }, // User sets 50% split ideally, but we default
        },
        {
            id: "text-sys",
            type: "textNode",
            position: { x: 400, y: 300 },
            data: { label: "User Instruction", text: "You are a marketing expert. Generate a catchy social media caption for this product image." },
        },
        {
            id: "llm-1",
            type: "llmNode",
            position: { x: 800, y: 200 },
            data: { label: "Generate Caption" },
        }
    ],
    edges: [
        {
            id: "e1-2",
            source: "media-upload-1",
            sourceHandle: "output", // image_url
            target: "crop-1",
            targetHandle: "image", // image_url
            type: "animatedPurple",
            animated: true,
        },
        {
            id: "e2-4",
            source: "crop-1",
            sourceHandle: "output",
            target: "llm-1",
            targetHandle: "images",
            type: "animatedPurple",
            animated: true,
        },
        {
            id: "e3-4",
            source: "text-sys",
            sourceHandle: "output",
            target: "llm-1",
            targetHandle: "user_message",
            type: "animatedPurple",
            animated: true,
        }
    ]
};
