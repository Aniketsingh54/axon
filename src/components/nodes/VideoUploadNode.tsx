"use client";

import { BaseNode } from "./BaseNode";
import { Film } from "lucide-react";
import { Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/lib/Dashboard";
import Transloadit from "@uppy/transloadit";
import Url from "@uppy/url";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

export function VideoUploadNode({ id, data, selected }: NodeProps) {
    const { updateNodeData } = useReactFlow();
    const [videoUrl, setVideoUrl] = useState((data.videoUrl as string) || "");

    const [uppy] = useState(() => {
        const uppy = new Uppy({
            restrictions: {
                maxNumberOfFiles: 1,
                allowedFileTypes: ["video/*"],
            },
            autoProceed: true,
        })
            .use(Transloadit, {
                waitForEncoding: true,
                params: {
                    auth: { key: "374c7b80e46111efa91f07185591cf59" }, // Demo Key
                    template_id: "0a56262450844781b0a858540b6e4e83", // Generic Video Template (iPad High)
                },
            })
            .use(Url, { companionUrl: "https://companion.transloadit.com" });

        uppy.on("transloadit:complete", (assembly) => {
            const url = assembly.results?.ipad_high?.[0]?.ssl_url || assembly.uploads[0].ssl_url;
            console.log("Upload complete:", url);
            setVideoUrl(url);
            updateNodeData(id, { videoUrl: url });
        });

        return uppy;
    });

    return (
        <BaseNode
            id={id}
            title="Upload Video"
            icon={<Film className="h-4 w-4" />}
            selected={selected}
            handles={[
                { type: "source", position: Position.Right, id: "output" }
            ]}
            className="w-[300px]"
        >
            <div className="flex flex-col items-center gap-3">
                {videoUrl ? (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-black group">
                        <video
                            src={videoUrl}
                            controls
                            className="w-full h-full object-cover"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                setVideoUrl("");
                                updateNodeData(id, { videoUrl: "" });
                            }}
                        >
                            ×
                        </Button>
                    </div>
                ) : (
                    <div className="w-full h-[200px] overflow-hidden rounded-md border">
                        <div className="w-full h-[200px] overflow-hidden rounded-md border">
                            <Dashboard
                                uppy={uppy}
                                hideUploadButton
                                width="100%"
                                height="100%"
                                theme="light"
                            />
                        </div>
                    </div>
                )}
            </div>
        </BaseNode>
    );
}
