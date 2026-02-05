import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Handle, Position, HandleProps } from "@xyflow/react";
import { Loader2 } from "lucide-react";
import { useWorkflowStore } from "@/stores/workflowStore";

interface BaseNodeProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    selected?: boolean;
    isRunning?: boolean;
    isFinished?: boolean;
    error?: string;
    handles?: HandleProps[];
    className?: string; // Additional classes for the card
}

export function BaseNode({
    id, // New prop
    title,
    icon,
    children,
    selected,
    isRunning: propIsRunning,
    isFinished: propIsFinished,
    error: propError,
    handles = [],
    className,
}: BaseNodeProps & { id?: string }) {
    // Connect to global store for status
    const status = useWorkflowStore((s) => id ? s.nodeExecutionStatus[id] : undefined);

    // Derive state (Props override store for manual control if needed)
    const isRunning = propIsRunning || status === "running";
    const isFinished = propIsFinished || status === "success";
    const error = propError || (status === "error" ? "Execution Failed" : undefined);

    return (
        <Card
            className={cn(
                "min-w-[280px] bg-card border-[1px] border-white/10 shadow-xl transition-all duration-300 rounded-[16px] overflow-hidden",
                selected ? "border-primary/50 ring-1 ring-primary/30" : "border-white/5",
                isRunning && "animate-pulse border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]",
                isFinished && "border-green-500",
                error && "border-destructive",
                className
            )}
        >
            {handles.map((handle, index) => (
                <Handle
                    key={`${handle.id}-${index}`}
                    {...handle}
                    className={cn(
                        "w-2.5 h-2.5 bg-muted-foreground/80 border-0 transition-all hover:w-3.5 hover:h-3.5 hover:bg-primary z-50",
                        handle.className
                    )}
                />
            ))}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 bg-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-white/5 text-foreground/90">
                        {icon}
                    </div>
                    <CardTitle className="text-[13px] font-medium tracking-wide text-foreground/90 font-sans">
                        {title}
                    </CardTitle>
                </div>
                {isRunning && <Loader2 className="h-3 w-3 animate-spin text-purple-500" />}
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                {children}
                {error && <p className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
            </CardContent>
        </Card>
    );
}
