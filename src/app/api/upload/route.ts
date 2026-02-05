import { NextResponse } from "next/server";
import { saveFile } from "@/lib/file-storage";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        // Validate type if needed (image/video)

        const url = await saveFile(file);

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error("Upload error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
