import { z } from "zod";

export const NodeConfigSchema = z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.record(z.string(), z.any()),
});

export const WorkflowSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    nodes: z.array(NodeConfigSchema),
    edges: z.array(z.any()),
});

// App specific schemas
export const TextNodeDataSchema = z.object({
    text: z.string(),
});

export const ImageUploadNodeDataSchema = z.object({
    imageUrl: z.string().url(),
});

export const VideoUploadNodeDataSchema = z.object({
    videoUrl: z.string().url(),
});

export const LLMNodeDataSchema = z.object({
    model: z.enum(["gemini-pro", "gemini-pro-vision"]),
    systemPrompt: z.string().optional(),
    userMessage: z.string(),
    images: z.array(z.string()).optional(),
});
