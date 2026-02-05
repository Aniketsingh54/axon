"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { History, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

type Run = {
    id: string;
    status: string;
    triggeredAt: string;
    duration?: number;
};

// Assuming we pass workflowId or fetch default
export function HistoryPanel({ workflowId }: { workflowId?: string }) {
    const [runs, setRuns] = useState<Run[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch runs if workflowId is present
        if (!workflowId) return;

        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/workflow/${workflowId}/runs`);
                if (res.ok) {
                    const data = await res.json();
                    setRuns(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        load();

        // Setup simple polling for history panel
        const interval = setInterval(load, 5000); // 5s refresh
        return () => clearInterval(interval);
    }, [workflowId]);

    return (
        <div className="flex h-full flex-col border-l bg-muted/10">
            <div className="flex items-center gap-2 p-4 border-b">
                <History className="h-4 w-4" />
                <h2 className="text-sm font-semibold">Workflow History</h2>
            </div>
            <ScrollArea className="flex-1 p-4">
                {loading && runs.length === 0 ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin h-4 w-4 text-muted-foreground" /></div>
                ) : runs.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-10">
                        No runs yet. Execute the workflow to see history here.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {runs.map((run) => (
                            <div key={run.id} className="flex flex-col gap-1 p-3 border rounded-md bg-background shadow-sm hover:bg-accent/50 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {run.status === "COMPLETED" || run.status === "SUCCESS" ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : run.status === "FAILED" || run.status === "ERROR" ? (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        ) : (
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                        )}
                                        <span className="text-sm font-medium">{run.status}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(run.triggeredAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground pl-6">
                                    ID: {run.id.slice(0, 8)}...
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
