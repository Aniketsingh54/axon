# Weavy.ai Clone

A visual workflow builder for LLM and Media processing, featuring a "real" backend implementation.

## Features
- **Visual Builder**: React Flow based node editor.
- **AI Integration**: Google Gemini (Text & Vision).
- **Media Processing**: Local FFmpeg integration for Image Cropping and Video Frame Extraction.
- **Orchestration**: Trigger.dev V2 for executing complex, parallel workflows.

## Prerequisites

Ensure you have the following in your `.env` file (create if missing):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/weavy_clone"

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Trigger.dev
TRIGGER_API_KEY=tr_dev_...
TRIGGER_API_URL=https://api.trigger.dev

# AI
GEMINI_API_KEY=...
```

## How to Run

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Setup Database**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

3.  **Start Trigger.dev Agent** (Required for workflow execution)
    In a separate terminal:
    ```bash
    npx trigger.dev@latest dev
    ```

4.  **Start Next.js Server**
    In your main terminal:
    ```bash
    npm run dev
    ```

5.  **Access App**
    Open [http://localhost:3000/builder](http://localhost:3000/builder)

## Usage

1.  Click **"Load Sample"** in the top right to load the *Product Marketing Kit* workflow.
2.  Click **"Run Workflow"**.
3.  Watch the nodes execute in real-time!

## Deployment (Vercel)

This project is Vercel-ready.

1.  **Push to GitHub**.
2.  **Import to Vercel**.
3.  **Environment Variables**:
    - Add all keys from `.env`.
    - **Important**: Add a Vercel Blob store for uploads.
        - Go to Vercel Dashboard -> Storage -> Create Blob.
        - Link it to your project.
        - This automatically adds `BLOB_READ_WRITE_TOKEN`.
    - **Trigger.dev**:
        - You must run the `npx trigger.dev dev` command LOCALLY or setup a dedicated server if using V2, as Vercel Functions time out for long jobs.
        - OR use **Trigger.dev Cloud** (V3 recommended for serverless) but this cloned setup uses V2 syntax.
        - *Workaround*: For this demo, keep your local machine running `npx trigger.dev dev` connected to the *Deployed* project ID.

