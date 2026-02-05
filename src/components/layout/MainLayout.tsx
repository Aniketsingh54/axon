"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sidebar } from "./Sidebar";
import { HistoryPanel } from "./HistoryPanel";
import { Canvas } from "@/components/builder/Canvas";

export function MainLayout() {
  return (
    <div className="h-screen w-full bg-background overscroll-none">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="min-w-[250px]">
          <Sidebar />
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={60}>
          <Canvas />
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="min-w-[300px]">
          <HistoryPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
