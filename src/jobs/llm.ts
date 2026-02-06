import { client } from "@/lib/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";

export const llmJob = client.defineJob({
    id: "llm-generate",
    name: "LLM Generation (Gemini)",
    version: "1.0.0",
    trigger: eventTrigger({
        name: "llm.generate",
        schema: z.object({
            model: z.string().default("gemini-2.0-flash"),
            systemPrompt: z.string().optional(),
            userMessage: z.string(),
            images: z.array(z.string()).optional(),
            nodeId: z.string(),
            runId: z.string(),
        }),
    }),
    run: async (payload, io, ctx) => {
        await io.logger.info("Starting Gemini Generation", { payload });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined");
        }

        // Determine model: If images are present, ensure we use a vision-capable model (like 1.5-flash or pro)
        // If user explicitly asked for gemini-pro (text-only legacy), upgrade them to 1.5-flash
        let modelName = payload.model;

        // Sanitize model name to remove "models/" prefix if present
        if (modelName.startsWith("models/")) {
            modelName = modelName.replace("models/", "");
        }

        await io.logger.info("Original Model Name:", { modelName });

        if (modelName === "gemini-pro" || modelName === "gemini-1.5-flash" || modelName.includes("flash")) {
            modelName = "gemini-2.5-flash";
            await io.logger.info("Upgrading Model to:", { modelName });
        }

        try {
            const parts: any[] = [];

            // Add System Prompt if exists
            // We'll prepend it to the user message or use user role with system instruction text
            if (payload.systemPrompt) {
                parts.push({ text: `System Instruction: ${payload.systemPrompt}\n\n` });
            }

            // Add Images
            if (payload.images && payload.images.length > 0) {
                await io.logger.info("Fetching images for Vision...");

                const imageParts = await Promise.all(payload.images.map(async (url) => {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    return {
                        inline_data: {
                            data: buffer.toString("base64"),
                            mime_type: response.headers.get("content-type") || "image/jpeg"
                        }
                    };
                }));
                parts.push(...imageParts);
            }

            // Add User Message
            parts.push({ text: payload.userMessage });

            // Construct payload for Gemini API
            const requestBody = {
                contents: [
                    {
                        parts: parts
                    }
                ]
            };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            await io.logger.info("Calling Gemini API", { apiUrl: `...${modelName}...` }); // Don't log full URL with key

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Extract text from response
            // Response structure: candidate -> content -> parts -> text
            const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

            await io.logger.info("Gemini Generation Complete", { resultTextLen: resultText.length });

            return {
                output: resultText,
                nodeId: payload.nodeId,
                runId: payload.runId
            };

        } catch (error: any) {
            await io.logger.error("Gemini Error", { error: error.message });
            throw error;
        }
    },
});
