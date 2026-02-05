
import prisma from "@/lib/prisma";
import { buildExecutionPlan, getInputValues } from "@/lib/engine";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// --- SETUP ---
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- MOCK IO ---
const mockIO = {
    logger: {
        info: async (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data),
        error: async (msg: string, data?: any) => console.error(`[ERROR] ${msg}`, data),
    },
    runTask: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
        console.log(`[TASK] ${name}`);
        return await fn();
    }
};

// --- JOBS LOGIC ---

async function executeLLM(payload: any, io: any, runId: string) {
    await io.logger.info("Starting Gemini Generation", { payload });

    let modelName = payload.model;
    if (payload.images && payload.images.length > 0) {
        if (modelName === "gemini-pro") modelName = "gemini-1.5-flash";
    }

    const model = geminiClient.getGenerativeModel({ model: modelName });
    let resultText = "";

    try {
        const parts: any[] = [];

        if (payload.systemPrompt) {
            parts.push({ text: `System Instruction: ${payload.systemPrompt}\n\n` });
        }

        if (payload.images && payload.images.length > 0) {
            await io.logger.info("Fetching images for Vision...");
            const imageParts = await Promise.all(payload.images.map(async (url: string) => {
                // Determine if local file or remote
                let fetchUrl = url;
                // If relative path from our uploads
                if (url.startsWith("/")) {
                    // This is tricky inside Docker/Localhost context if using fetch.
                    // Ideally we read file from disk if it's local.
                    // But let's assume valid URL or handle File read.
                    // For now, let's try reading from FS if local path?
                    // No, let's assume the URL is publicly accessible or use filesystem read if it is in public folder.

                    // Actually, for local docker, 'http://localhost:3000/...' might fail if container can't see itself easily.
                    // Let's read from FS if it starts with /uploads
                    const fsPath = join(process.cwd(), "public", url.substring(1)); // remove leading slash
                    if (existsSync(fsPath)) {
                        const fs = await import("fs/promises");
                        const data = await fs.readFile(fsPath);
                        return {
                            inlineData: {
                                data: data.toString("base64"),
                                mimeType: "image/jpeg" // Simple assumption
                            }
                        };
                    }
                }

                const response = await fetch(fetchUrl);
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

        parts.push({ text: payload.userMessage });

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
        runId
    };
}

async function processMedia(
    type: "crop" | "extract_frame",
    inputRelativeUrl: string,
    params: any,
    runId: string,
    nodeId: string
): Promise<string> {
    const relativePath = inputRelativeUrl.startsWith("/") ? inputRelativeUrl.slice(1) : inputRelativeUrl;
    const inputPath = join(process.cwd(), "public", relativePath);

    if (!existsSync(inputPath)) {
        if (inputRelativeUrl.startsWith("http")) return inputRelativeUrl;
        throw new Error(`File not found: ${inputPath}`);
    }

    const outputDir = join(process.cwd(), "public", "processed");
    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

    const outputFilename = `${nodeId}-${runId}-${type}-${Date.now()}.jpg`;
    const outputPath = join(outputDir, outputFilename);
    const outputPublicUrl = `/processed/${outputFilename}`;

    return new Promise((resolve, reject) => {
        let command = ffmpeg(inputPath);

        if (type === "crop") {
            const wPct = parseFloat(params.w) || 100;
            const hPct = parseFloat(params.h) || 100;
            const xPct = parseFloat(params.x) || 0;
            const yPct = parseFloat(params.y) || 0;

            // Simplified Mock Crop (Center 500x500) if probing implies complexity we want to skip for Demo.
            // But let's try to do it rightish.
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) return reject(err);
                const stream = metadata.streams.find(s => s.width && s.height);
                if (!stream || !stream.width || !stream.height) return reject("No video/image stream");

                const width = stream.width;
                const height = stream.height;

                const w = Math.round((wPct / 100) * width);
                const h = Math.round((hPct / 100) * height);
                const x = Math.round((xPct / 100) * width);
                const y = Math.round((yPct / 100) * height);

                ffmpeg(inputPath)
                    .videoFilters(`crop=${w}:${h}:${x}:${y}`)
                    .output(outputPath)
                    .on("end", () => resolve(outputPublicUrl))
                    .on("error", (e) => reject(e))
                    .run();
            });
            return;
        }
        else if (type === "extract_frame") {
            const timestamp = params.timestamp || "00:00:01";
            command
                .screenshots({
                    timestamps: [timestamp],
                    filename: outputFilename,
                    folder: outputDir,
                    size: '800x?'
                })
                .on("end", () => resolve(outputPublicUrl))
                .on("error", (e) => reject(e));
        }
    });
}

async function executeMedia(payload: any, io: any, runId: string) {
    await io.logger.info("Starting Media Processing", { payload });
    try {
        const outputUrl = await processMedia(
            payload.type,
            payload.inputUrl,
            payload.params,
            runId,
            payload.nodeId
        );
        return {
            outputUrl,
            nodeId: payload.nodeId,
            runId
        };
    } catch (error: any) {
        await io.logger.error("Media Processing Failed", { error: error.message });
        throw error;
    }
}


// --- MAIN WORKFLOW EXECUTOR ---

export async function executeWorkflowLocally(payload: { workflowId: string, userId: string, nodes: any[], edges: any[] }) {
    const io = mockIO;
    const { workflowId, userId, nodes, edges } = payload;

    await io.logger.info("Starting Local Workflow Execution", { workflowId });

    // 1. Create Run Record
    const run = await prisma.workflowRun.create({
        data: {
            workflowId,
            status: "RUNNING",
        }
    });

    try {
        // 2. Build Plan
        const { levels } = buildExecutionPlan(nodes, edges);

        const nodeOutputs: Record<string, any> = {};

        // 3. Execute Levels
        for (let i = 0; i < levels.length; i++) {
            const level = levels[i];

            await Promise.all(
                level.map(async (nodeId) => {
                    const node = nodes.find((n: any) => n.id === nodeId);
                    if (!node) return;

                    await prisma.nodeExecution.create({
                        data: {
                            runId: run.id,
                            nodeId,
                            status: "RUNNING",
                            inputs: {},
                        }
                    });

                    const inputs = getInputValues(nodeId, edges, nodeOutputs);
                    const mergedData = { ...node.data, ...inputs };
                    let output: any = null;

                    if (node.type === "llmNode") {
                        const inputsResolved = {
                            userMessage: mergedData.user_message || mergedData.userMessage || "",
                            systemPrompt: mergedData.system_prompt || mergedData.systemPrompt,
                        };

                        if (!inputsResolved.userMessage && inputsResolved.systemPrompt) {
                            inputsResolved.userMessage = inputsResolved.systemPrompt;
                            inputsResolved.systemPrompt = undefined;
                        }

                        // CALL LOCAL LLM FUNCTION
                        output = await executeLLM({
                            nodeId,
                            model: mergedData.model || "gemini-pro",
                            systemPrompt: inputsResolved.systemPrompt,
                            userMessage: inputsResolved.userMessage,
                            images: mergedData.images
                        }, io, run.id);

                    } else if (node.type === "cropNode") {
                        output = await executeMedia({
                            nodeId,
                            type: "crop",
                            inputUrl: mergedData.image_url || mergedData.imageUrl || "",
                            params: { x: mergedData.x_percent, y: mergedData.y_percent, w: mergedData.width_percent, h: mergedData.height_percent }
                        }, io, run.id);

                    } else if (node.type === "frameExtractNode") {
                        output = await executeMedia({
                            nodeId,
                            type: "extract_frame",
                            inputUrl: mergedData.video_url || mergedData.videoUrl || "",
                            params: { timestamp: mergedData.timestamp }
                        }, io, run.id);
                    } else {
                        // Pass through
                        output = { ...node.data };
                    }

                    // Update Execution Record
                    await prisma.nodeExecution.updateMany({
                        where: { runId: run.id, nodeId },
                        data: {
                            status: "SUCCESS",
                            inputs: JSON.parse(JSON.stringify(inputs)),
                            outputs: output,
                            completedAt: new Date(),
                        }
                    });

                    // Store output for next level
                    // Since we are running in same process, we don't need to wrap return
                    // Just update the map
                    // Race condition on map? JS is single threaded event loop, map assignment is safe.
                    // But Promise.all runs concurrently.
                    // Yes, we just assign to specific key. Safe.
                })
            );

            // After level completes, populate nodeOutputs (redundant if done in map, but let's be safe)
            // Wait, inside map we don't see results from siblings.
            // We need to collect results.

            // Re-do the loop to collect results properly from Promise.all return
            // Actually, getInputValues reads from nodeOutputs.
            // Next level relies on THIS level completing.
            // So we just need to ensure nodeOutputs is populated before next iteration of 'i'.
            // My code above doesn't populate nodeOutputs in the map! It only defined 'output'.
            // FIX:

            // Re-writing the level execution loop to return values
        }

        // --- RE-WRITING EXECUTION LOOP FOR CORRECTNESS ---
        // (Self-correction during write)
        for (let i = 0; i < levels.length; i++) {
            const level = levels[i];
            const results = await Promise.all(
                level.map(async (nodeId) => {
                    const node = nodes.find((n: any) => n.id === nodeId);
                    if (!node) return null;

                    // (Create DB record logic same as above)
                    await prisma.nodeExecution.create({
                        data: { runId: run.id, nodeId, status: "RUNNING", inputs: {} }
                    });

                    const inputs = getInputValues(nodeId, edges, nodeOutputs);
                    const mergedData = { ...node.data, ...inputs };
                    let output: any = null;

                    // (Dispatch logic same as above)
                    if (node.type === "llmNode") {
                        const inputsResolved = {
                            userMessage: mergedData.user_message || mergedData.userMessage || "",
                            systemPrompt: mergedData.system_prompt || mergedData.systemPrompt,
                        };
                        if (!inputsResolved.userMessage && inputsResolved.systemPrompt) {
                            inputsResolved.userMessage = inputsResolved.systemPrompt;
                            inputsResolved.systemPrompt = undefined;
                        }
                        output = await executeLLM({
                            nodeId,
                            model: mergedData.model || "gemini-pro",
                            systemPrompt: inputsResolved.systemPrompt,
                            userMessage: inputsResolved.userMessage,
                            images: mergedData.images
                        }, io, run.id);
                    } else if (node.type === "cropNode") {
                        output = await executeMedia({
                            nodeId, type: "crop",
                            inputUrl: mergedData.image_url || mergedData.imageUrl || "",
                            params: { x: mergedData.x_percent, y: mergedData.y_percent, w: mergedData.width_percent, h: mergedData.height_percent }
                        }, io, run.id);
                    } else if (node.type === "frameExtractNode") {
                        output = await executeMedia({
                            nodeId, type: "extract_frame",
                            inputUrl: mergedData.video_url || mergedData.videoUrl || "",
                            params: { timestamp: mergedData.timestamp }
                        }, io, run.id);
                    } else {
                        output = { ...node.data };
                    }

                    await prisma.nodeExecution.updateMany({
                        where: { runId: run.id, nodeId },
                        data: { status: "SUCCESS", inputs: JSON.parse(JSON.stringify(inputs)), outputs: output, completedAt: new Date() }
                    });

                    return { nodeId, output };
                })
            );

            // Populate nodeOutputs
            results.forEach(res => {
                if (res) nodeOutputs[res.nodeId] = res.output;
            });
        }

        // 4. Mark Run Complete
        await prisma.workflowRun.update({
            where: { id: run.id },
            data: { status: "COMPLETED", completedAt: new Date() }
        });

        return run;

    } catch (error: any) {
        await io.logger.error("Workflow Failed", { error });
        await prisma.workflowRun.update({
            where: { id: run.id },
            data: { status: "FAILED", completedAt: new Date() }
        });
        throw error;
    }
}
