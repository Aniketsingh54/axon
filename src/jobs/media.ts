import { client } from "@/lib/trigger";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// Set ffmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

// Helper to process media
async function processMedia(
    type: "crop" | "extract_frame",
    inputRelativeUrl: string,
    params: any,
    runId: string,
    nodeId: string
): Promise<string> {

    // Convert relative URL (from upload) to absolute file path
    // inputRelativeUrl like "/uploads/foo.jpg"
    // Remove leading slash
    const relativePath = inputRelativeUrl.startsWith("/") ? inputRelativeUrl.slice(1) : inputRelativeUrl;
    const inputPath = join(process.cwd(), "public", relativePath);

    if (!existsSync(inputPath)) {
        // If it's a remote URL (e.g. picsum or http), we would need to download it first.
        // For this Clone, we assume files are from our Upload Node (local).
        // Fallback: If http, just return it or throw.
        if (inputRelativeUrl.startsWith("http")) return inputRelativeUrl;
        throw new Error(`File not found: ${inputPath}`);
    }

    const outputDir = join(process.cwd(), "public", "processed");
    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

    const outputFilename = `${nodeId}-${runId}-${type}-${Date.now()}.jpg`; // Always jpg for now/output
    const outputPath = join(outputDir, outputFilename);
    const outputPublicUrl = `/processed/${outputFilename}`;

    return new Promise((resolve, reject) => {
        let command = ffmpeg(inputPath);

        if (type === "crop") {
            // params: x, y, w, h in PERCENTAGE (0-100) or pixels?
            // CropNode has inputs: x_percent, y_percent etc.
            // FFmpeg crop filter: w:h:x:y
            // We need image dimensions to calculate if percent.
            // Complex. Let's assume params are valid pixels or handle percent internally if knowing size.
            // fluent-ffmpeg doesn't easily give size without ffprobe.
            // Let's assume standard simple crop for clone demo:
            // crop=w:h:x:y
            // If we don't know size, we can't use percent easily in one pass without probe.
            // Simple approach: Use a fixed center crop or assume 500x500. 
            // OR ignore params and just do a center crop to prove it works.

            // Real implementation: PROBE first.
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) return reject(err);
                const stream = metadata.streams.find(s => s.width && s.height);
                if (!stream || !stream.width || !stream.height) return reject("No video/image stream");

                const width = stream.width;
                const height = stream.height;

                // Parse params (default to 0 if missing)
                const xPct = parseFloat(params.x) || 0;
                const yPct = parseFloat(params.y) || 0;
                const wPct = parseFloat(params.w) || 100;
                const hPct = parseFloat(params.h) || 100;

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

            return; // Return because we handle promise inside callback
        }
        else if (type === "extract_frame") {
            // params: timestamp (e.g. "00:00:05" or seconds)
            const timestamp = params.timestamp || "00:00:01";

            command
                .screenshots({
                    timestamps: [timestamp],
                    filename: outputFilename,
                    folder: outputDir,
                    size: '800x?' // Resize width to 800, keep aspect
                })
                .on("end", () => resolve(outputPublicUrl))
                .on("error", (e) => reject(e));
        }
    });
}

export const mediaJob = client.defineJob({
    id: "media-process",
    name: "Media Processing (FFmpeg)",
    version: "1.0.0",
    trigger: eventTrigger({
        name: "media.process",
        schema: z.object({
            type: z.enum(["crop", "extract_frame"]),
            inputUrl: z.string(),
            params: z.record(z.string(), z.any()), // x, y, w, h OR timestamp
            nodeId: z.string(),
            runId: z.string(),
        }),
    }),
    run: async (payload, io, ctx) => {
        await io.logger.info("Starting Media Processing (Real)", { payload });

        try {
            const outputUrl = await processMedia(
                payload.type,
                payload.inputUrl,
                payload.params,
                payload.runId,
                payload.nodeId
            );

            await io.logger.info("Media Processed successfully", { outputUrl });

            return {
                outputUrl,
                nodeId: payload.nodeId,
                runId: payload.runId
            };
        } catch (error: any) {
            await io.logger.error("Media Processing Failed", { error: error.message });
            throw error;
        }
    },
});
