import { client } from "@/lib/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { buildExecutionPlan, getInputValues } from "@/lib/engine";
import { mediaJob } from "./media";
import { llmJob } from "./llm";

export const workflowJob = client.defineJob({
    id: "workflow-orchestrate",
    name: "Workflow Orchestrator",
    version: "1.0.0",
    trigger: eventTrigger({
        name: "workflow.start",
        schema: z.object({
            workflowId: z.string(),
            userId: z.string(),
            // We pass the full graph snapshot to ensure we run exactly what was visible
            nodes: z.array(z.any()),
            edges: z.array(z.any()),
        }),
    }),
    run: async (payload, io, ctx) => {
        const { workflowId, userId, nodes, edges } = payload;

        await io.logger.info("Starting Workflow", { workflowId });

        // 1. Create Run Record in DB
        // We wrap Prisma calls in io.runTask for idempotency/tracking
        const run = await io.runTask("create-run-record", async () => {
            return await prisma.workflowRun.create({
                data: {
                    workflowId,
                    status: "RUNNING",
                }
            });
        });

        try {
            // 2. Build Plan
            const { levels } = buildExecutionPlan(nodes, edges);
            await io.logger.info("Execution Plan Built", { levels });

            const nodeOutputs: Record<string, any> = {};

            // 3. Execute Levels Sequentially
            for (let i = 0; i < levels.length; i++) {
                const level = levels[i];

                // Execute nodes in this level in Parallel
                const levelResults = await Promise.all(
                    level.map(async (nodeId) => {
                        return await io.runTask(`exec-node-${nodeId}`, async () => {
                            const node = nodes.find((n: any) => n.id === nodeId);
                            if (!node) return null;

                            // Create Execution Record
                            await prisma.nodeExecution.create({
                                data: {
                                    runId: run.id,
                                    nodeId,
                                    status: "RUNNING",
                                    inputs: {}, // We'll update this
                                }
                            });

                            // Resolve Inputs
                            const inputs = getInputValues(nodeId, edges, nodeOutputs);
                            // Merge with manual node data
                            const mergedData = { ...node.data, ...inputs };

                            let output: any = null;

                            // Dispatch based on Type
                            if (node.type === "llmNode") {
                                const inputsResolved = {
                                    userMessage: mergedData.user_message || mergedData.userMessage || "",
                                    systemPrompt: mergedData.system_prompt || mergedData.systemPrompt,
                                };

                                // Robustness: If userMessage is empty but systemPrompt exists, swap them or use system as user message
                                // This handles users connecting Text Node to "System" handle by mistake
                                if (!inputsResolved.userMessage && inputsResolved.systemPrompt) {
                                    inputsResolved.userMessage = inputsResolved.systemPrompt;
                                    inputsResolved.systemPrompt = undefined;
                                }

                                output = await llmJob.invoke(`invoke-llm-${nodeId}`, {
                                    nodeId,
                                    runId: run.id,
                                    userMessage: inputsResolved.userMessage,
                                    systemPrompt: inputsResolved.systemPrompt,
                                    model: mergedData.model || "gemini-pro",
                                    images: mergedData.images
                                });
                            } else if (node.type === "cropNode") {
                                output = await mediaJob.invoke(`invoke-crop-${nodeId}`, {
                                    nodeId,
                                    runId: run.id,
                                    type: "crop",
                                    inputUrl: mergedData.image_url || mergedData.imageUrl || "",
                                    params: { x: mergedData.x_percent, y: mergedData.y_percent, w: mergedData.width_percent, h: mergedData.height_percent }
                                });
                            } else if (node.type === "frameExtractNode") {
                                output = await mediaJob.invoke(`invoke-extract-${nodeId}`, {
                                    nodeId,
                                    runId: run.id,
                                    type: "extract_frame",
                                    inputUrl: mergedData.video_url || mergedData.videoUrl || "",
                                    params: { timestamp: mergedData.timestamp }
                                });
                            } else {
                                // Pass-through for Input nodes (Text, Image, Video)
                                // They are "executed" by just passing their data forward
                                output = { ...node.data };
                            }

                            // Update Execution Record
                            await prisma.nodeExecution.updateMany({
                                where: { runId: run.id, nodeId },
                                data: {
                                    status: "SUCCESS",
                                    inputs: JSON.parse(JSON.stringify(inputs)), // Simple JSON safe
                                    outputs: output,
                                    completedAt: new Date(),
                                }
                            });

                            return { nodeId, output };
                        });
                    })
                );

                // Collect Outputs for next level
                levelResults.forEach(res => {
                    if (res) nodeOutputs[res.nodeId] = res.output;
                });
            }

            // 4. Mark Run Complete
            await io.runTask("mark-run-complete", async () => {
                await prisma.workflowRun.update({
                    where: { id: run.id },
                    data: {
                        status: "COMPLETED",
                        completedAt: new Date(),
                    }
                });
            });

        } catch (error: any) {
            await io.logger.error("Workflow Failed", { error });
            await io.runTask("mark-run-failed", async () => {
                await prisma.workflowRun.update({
                    where: { id: run.id },
                    data: {
                        status: "FAILED",
                        completedAt: new Date(),
                    }
                });
            });
            throw error;
        }
    },
});
