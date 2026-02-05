"use client";

import { BaseNode } from "./BaseNode";
import { Type } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Position, type NodeProps } from "@xyflow/react";
import { useState, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";

export function TextNode({ id, data, selected }: NodeProps) {
    const { updateNodeData } = useReactFlow();
    const [text, setText] = useState((data.text as string) || "");

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setText(val);
        updateNodeData(id, { text: val });
    }, [id, updateNodeData]);

    return (
        <BaseNode
            id={id}
            title="Text"
            icon={<Type className="h-4 w-4" />}
            selected={selected}
            handles={[
                { type: "source", position: Position.Right, id: "output" }
            ]}
        >
            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                    Enter text
                </label>
                <Textarea
                    value={text}
                    onChange={handleChange}
                    placeholder="Type something..."
                    className="min-h-[80px] text-xs resize-y nodrag"
                />
            </div>
        </BaseNode>
    );
}
