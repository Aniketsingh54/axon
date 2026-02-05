import { createAppRoute } from "@trigger.dev/nextjs";
import { client } from "@/lib/trigger";

// POST /api/trigger
export const POST = createAppRoute(client);
