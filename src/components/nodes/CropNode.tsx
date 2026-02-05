"use client";

import { BaseNode } from "./BaseNode";
import { Crop } from "lucide-react";
import { Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CropNode({ id, data, selected }: NodeProps) {
    const { updateNodeData } = useReactFlow();

    const handleChange = (key: string, val: string) => {
        updateNodeData(id, { [key]: val });
    };

    return (
        <BaseNode
            id={id}
            title="Crop Image"
            icon={<Crop className="h-4 w-4" />}
            selected={selected}
            handles={[
                { type: "target", position: Position.Left, id: "image_url", style: { top: "20%" } },
                { type: "target", position: Position.Left, id: "x_percent", style: { top: "40%" } },
                { type: "target", position: Position.Left, id: "y_percent", style: { top: "50%" } },
                { type: "target", position: Position.Left, id: "width_percent", style: { top: "70%" } },
                { type: "target", position: Position.Left, id: "height_percent", style: { top: "80%" } },
                { type: "source", position: Position.Right, id: "output" }
            ]}
            className="min-w-[250px]"
        >
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-[10px]">X %</Label>
                        <Input
                            className="h-6 text-[10px]"
                            placeholder="0"
                            onChange={(e) => handleChange("x_percent", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px]">Y %</Label>
                        <Input
                            className="h-6 text-[10px]"
                            placeholder="0"
                            onChange={(e) => handleChange("y_percent", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px]">Width %</Label>
                        <Input
                            className="h-6 text-[10px]"
                            placeholder="100"
                            defaultValue="100"
                            onChange={(e) => handleChange("width_percent", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px]">Height %</Label>
                        <Input
                            className="h-6 text-[10px]"
                            placeholder="100"
                            defaultValue="100"
                            onChange={(e) => handleChange("height_percent", e.target.value)}
                        />
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground">Connect Image to Input Handle</p>
            </div>
        </BaseNode>
    );
}
