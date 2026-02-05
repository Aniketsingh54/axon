"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Type,
    Image as ImageIcon,
    Film,
    Sparkles,
    Crop,
    Scan,
    Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

export function Sidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <div className="flex h-full flex-col border-r bg-muted/10">
            <div className="p-4">
                <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Nodes</h2>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search nodes..." className="pl-8" />
                </div>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">

                    <div className="space-y-2">
                        <h3 className="px-2 text-sm font-medium text-muted-foreground">Quick Access</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <NodeButton
                                label="Text"
                                icon={<Type className="h-4 w-4" />}
                                type="textNode"
                                onDragStart={onDragStart}
                            />
                            <NodeButton
                                label="Image"
                                icon={<ImageIcon className="h-4 w-4" />}
                                type="imageUploadNode"
                                onDragStart={onDragStart}
                            />
                            <NodeButton
                                label="Video"
                                icon={<Film className="h-4 w-4" />}
                                type="videoUploadNode"
                                onDragStart={onDragStart}
                            />
                            <NodeButton
                                label="LLM"
                                icon={<Sparkles className="h-4 w-4 text-purple-500" />}
                                type="llmNode"
                                onDragStart={onDragStart}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <h3 className="px-2 text-sm font-medium text-muted-foreground">Media Processing</h3>
                        <div className="grid gap-2">
                            <NodeButton
                                label="Crop Image"
                                icon={<Crop className="h-4 w-4" />}
                                type="cropNode"
                                onDragStart={onDragStart}
                            />
                            <NodeButton
                                label="Extract Frame"
                                icon={<Scan className="h-4 w-4" />}
                                type="frameExtractNode"
                                onDragStart={onDragStart}
                            />
                        </div>
                    </div>

                </div>
            </ScrollArea>
        </div>
    );
}

function NodeButton({
    label,
    icon,
    type,
    onDragStart
}: {
    label: string;
    icon: React.ReactNode;
    type: string;
    onDragStart: (event: React.DragEvent, nodeType: string) => void;
}) {
    return (
        <div
            draggable
            onDragStart={(event) => onDragStart(event, type)}
            className="flex cursor-grab flex-col items-center justify-center gap-2 rounded-md border bg-card p-4 hover:bg-accent/50 hover:text-accent-foreground transition-colors"
        >
            {icon}
            <span className="text-xs font-medium">{label}</span>
        </div>
    );
}
