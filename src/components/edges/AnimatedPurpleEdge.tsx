"use client";

import { BaseEdge, EdgeProps, getBezierPath } from "@xyflow/react";

export function AnimatedPurpleEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <BaseEdge
            path={edgePath}
            markerEnd={markerEnd}
            style={{
                ...style,
                strokeWidth: 2.5,
                stroke: "#a855f7",
            }}
            className="react-flow__edge-path stroke-2 animate-pulse"
        />
    );
}
