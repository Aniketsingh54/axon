"use client";

import { BaseNode } from "./BaseNode";
import { Scan } from "lucide-react";
import { Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FrameExtractNode({ id, data, selected }: NodeProps) {
    const { updateNodeData } = useReactFlow();

    return (
        <BaseNode
            id={id}
            title="Extract Frame"
            icon={<Scan className="h-4 w-4" />}
            selected={selected}
            handles={[
                { type: "target", position: Position.Left, id: "video_url", style: { top: "30%" } },
                { type: "target", position: Position.Left, id: "timestamp", style: { top: "60%" } },
                { type: "source", position: Position.Right, id: "output" }
            ]}
            className="min-w-[250px]"
        >
            <div className="space-y-2">
                <Label className="text-xs">Timestamp (sec or %)</Label>
                <Input
                    className="h-7 text-xs"
                    placeholder="e.g. 5 or 50%"
                    onChange={(e) => updateNodeData(id, { timestamp: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">Connect Video URL to Input Handle</p>
            </div>
        </BaseNode>
    );
}
