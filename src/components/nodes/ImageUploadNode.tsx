"use client";

import { BaseNode } from "./BaseNode";
import { Image as ImageIcon } from "lucide-react";
import { Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/lib/Dashboard";
import Transloadit from "@uppy/transloadit";
import Url from "@uppy/url";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

export function ImageUploadNode({ id, data, selected }: NodeProps) {
    const { updateNodeData } = useReactFlow();
    const [imageUrl, setImageUrl] = useState((data.imageUrl as string) || "");

    const [uppy] = useState(() => {
        const uppy = new Uppy({
            restrictions: {
                maxNumberOfFiles: 1,
                allowedFileTypes: ["image/*"],
            },
            autoProceed: true,
        })
            .use(Transloadit, {
                waitForEncoding: true,
                params: {
                    auth: { key: "374c7b80e46111efa91f07185591cf59" }, // Demo Key - In prod use process.env via signature endpoint
                    template_id: "755490e6e73f44388147d3d2427a9446", // Generic Image Template
                },
            })
            .use(Url, { companionUrl: "https://companion.transloadit.com" });

        uppy.on("transloadit:complete", (assembly) => {
            const url = assembly.results?.compressed_image?.[0]?.ssl_url || assembly.uploads[0].ssl_url;
            console.log("Upload complete:", url);
            setImageUrl(url);
            updateNodeData(id, { imageUrl: url });
        });

        return uppy;
    });

    return (
        <BaseNode
            id={id}
            title="Upload Image"
            icon={<ImageIcon className="h-4 w-4" />}
            selected={selected}
            handles={[
                { type: "source", position: Position.Right, id: "output" }
            ]}
            className="w-[300px]"
        >
            <div className="flex flex-col items-center gap-3">
                {imageUrl ? (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden border group">
                        <Image
                            src={imageUrl}
                            alt="Uploaded"
                            fill
                            className="object-cover"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                setImageUrl("");
                                updateNodeData(id, { imageUrl: "" });
                            }}
                        >
                            ×
                        </Button>
                    </div>
                ) : (
                    <div className="w-full h-[200px] overflow-hidden rounded-md border">
                        <Dashboard
                            uppy={uppy}
                            hideUploadButton
                            width="100%"
                            height="100%"
                            theme="light"
                        />
                    </div>
                )}
            </div>
        </BaseNode>
    );
}
