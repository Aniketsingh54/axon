import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";

export async function saveFile(file: File, folder: string = "uploads"): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure directory exists
    const uploadDir = join(process.cwd(), "public", folder);
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // Ignore if exists
    }

    // Unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.name.split('.').pop();
    const filename = `${file.name.replace(/\.[^/.]+$/, "")}-${uniqueSuffix}.${ext}`;

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    return `/${folder}/${filename}`;
}
