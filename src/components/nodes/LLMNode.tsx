"use client";

import { BaseNode } from "./BaseNode";
import { Sparkles, Bot } from "lucide-react";
import { Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function LLMNode({ id, data, selected }: NodeProps) {
    const { updateNodeData } = useReactFlow();
    const [model, setModel] = useState((data.model as string) || "gemini-pro");

    // Output result would be stored in data.output
    const output = (data.output as string) || "";

    return (
        <BaseNode
            id={id}
            title="Run Any LLM"
            icon={<Sparkles className="h-4 w-4 text-purple-500" />}
            selected={selected}
            // Handles: system_prompt, user_message, images, output
            handles={[
                { type: "target", position: Position.Left, id: "system_prompt", style: { top: "30%" } },
                { type: "target", position: Position.Left, id: "user_message", style: { top: "50%" } },
                { type: "target", position: Position.Left, id: "images", style: { top: "70%" } },
                { type: "source", position: Position.Right, id: "output" }
            ]}
            className="min-w-[350px]"
        >
            <div className="space-y-4">

                <div className="space-y-2">
                    <Label className="text-xs">Model</Label>
                    <Select
                        value={model}
                        onValueChange={(val) => {
                            setModel(val);
                            updateNodeData(id, { model: val });
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                            <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400" /> System
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-400" /> User
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-400" /> Images
                    </div>
                </div>

                {output && (
                    <div className="mt-2 p-2 bg-muted rounded-md text-xs border border-purple-200 dark:border-purple-900">
                        <span className="font-semibold block mb-1">Output:</span>
                        {output}
                    </div>
                )}

            </div>
        </BaseNode>
    );
}
