import { client } from "@/lib/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const llmJob = client.defineJob({
    id: "llm-generate",
    name: "LLM Generation (Gemini)",
    version: "1.0.0",
    trigger: eventTrigger({
        name: "llm.generate",
        schema: z.object({
            model: z.string().default("gemini-pro"),
            systemPrompt: z.string().optional(),
            userMessage: z.string(),
            images: z.array(z.string()).optional(),
            nodeId: z.string(),
            runId: z.string(),
        }),
    }),
    run: async (payload, io, ctx) => {
        await io.logger.info("Starting Gemini Generation", { payload });

        // Determine model: If images are present, ensure we use a vision-capable model (like 1.5-flash or pro)
        // If user explicitly asked for gemini-pro (text-only legacy), upgrade them if images exist.
        let modelName = payload.model;
        if (payload.images && payload.images.length > 0) {
            // 1.5-flash is fast and vision capable. 
            // If payload says "gemini-pro", upgrade to "gemini-1.5-flash"
            if (modelName === "gemini-pro") modelName = "gemini-1.5-flash";
        }

        const model = geminiClient.getGenerativeModel({ model: modelName });

        let resultText = "";

        try {
            const parts: any[] = [];

            // Add System Prompt if exists (Gemini 1.5 supports systemInstruction at model level, but chat history works too)
            // For simplicity in chat flow:
            if (payload.systemPrompt) {
                // We'll prepend it to user message or use systemInstruction if initializing model (better)
                // But here we are reusing the model instance. 
                // Let's just prepend to user message for maximum compatibility in this simple flow.
                parts.push({ text: `System Instruction: ${payload.systemPrompt}\n\n` });
            }

            // Add Images
            if (payload.images && payload.images.length > 0) {
                await io.logger.info("Fetching images for Vision...");

                // Fetch images from URL and convert to Base64
                const imageParts = await Promise.all(payload.images.map(async (url) => {
                    // Start a sub-task for fetching to avoid timeout issues if large? 
                    // No, fetch is fast.
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    return {
                        inlineData: {
                            data: buffer.toString("base64"),
                            mimeType: response.headers.get("content-type") || "image/jpeg"
                        }
                    };
                }));
                parts.push(...imageParts);
            }

            // Add User Message
            parts.push({ text: payload.userMessage });

            // Generate Content
            // We use generateContent for single turn (which this is, as it's a node execution)
            const result = await model.generateContent(parts);
            const response = result.response;
            resultText = response.text();

            await io.logger.info("Gemini Generation Complete", { resultText });

        } catch (error: any) {
            await io.logger.error("Gemini Error", { error: error.message });
            throw error;
        }

        return {
            text: resultText,
            nodeId: payload.nodeId,
            runId: payload.runId
        };
    },
});
