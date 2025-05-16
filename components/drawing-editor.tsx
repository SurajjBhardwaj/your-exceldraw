"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, ArrowLeft, Download, Loader2 } from "lucide-react";
import { debounce } from "lodash";
import type { Drawing } from "@/lib/types";

// Ensure Excalidraw works with React 18
import dynamic from "next/dynamic";

// Dynamically import Excalidraw to avoid SSR issues
const ExcalidrawComponent = dynamic(
  async () => {
    const { Excalidraw } = await import("@excalidraw/excalidraw");
    return Excalidraw;
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading drawing canvas...
        </span>
      </div>
    ),
  }
);

interface DrawingEditorProps {
  initialData: Drawing | null;
}

export function DrawingEditor({ initialData }: DrawingEditorProps) {
  const [name, setName] = useState(initialData?.name || "Untitled Drawing");
  const excalidrawAPIRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [isExcalidrawLoaded, setIsExcalidrawLoaded] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Parse initial content if available
  const initialContent = initialData?.content
    ? JSON.parse(initialData.content)
    : null;

  // Manual save function - separate from the debounced version
  const handleSaveClick = async () => {
    try {
      console.log("Save button clicked");
      setIsSaving(true);

      if (!excalidrawAPIRef.current) {
        console.error("Excalidraw API reference is not available");
        toast({
          title: "Error",
          description: "Drawing canvas is not ready. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Get elements and app state
      let elements, appState;
      try {
        elements = excalidrawAPIRef.current.getSceneElements();
        appState = excalidrawAPIRef.current.getAppState();

        console.log("Got elements and appState", {
          elementsCount: elements?.length || 0,
          hasAppState: !!appState,
        });

        if (!elements || !appState) {
          throw new Error("Could not get drawing data");
        }
      } catch (err) {
        console.error("Error getting scene elements or app state:", err);
        toast({
          title: "Error",
          description: "Could not access drawing data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const content = JSON.stringify({
        elements,
        appState,
      });

      console.log("Preparing to save drawing", {
        name,
        contentLength: content.length,
        isUpdate: !!initialData,
      });

      const url = initialData
        ? `/api/drawings/${initialData.id}`
        : "/api/drawings";
      const method = initialData ? "PUT" : "POST";

      console.log(`Making ${method} request to ${url}`);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          content,
        }),
      });

      console.log("API response status:", response.status);

      const responseData = await response.json();
      console.log("API response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save drawing");
      }

      // If this is a new drawing, redirect to the edit page
      if (!initialData) {
        console.log(
          "Redirecting to new drawing page:",
          `/editor/${responseData.id}`
        );
        router.push(`/editor/${responseData.id}`);
      }

      setLastSaved(new Date());

      toast({
        title: "Success",
        description: "Drawing saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving drawing:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to save drawing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce(() => {
      if (canvasReady) {
        console.log("Auto-save triggered");
        handleSaveClick();
      } else {
        console.log("Auto-save skipped - canvas not ready");
      }
    }, 5000),
    [canvasReady, name, initialData] // Re-create when these dependencies change
  );

  // Handle changes to the drawing
  const handleChange = useCallback(() => {
    if (excalidrawAPIRef.current && canvasReady) {
      console.log("Drawing changed, scheduling auto-save");
      debouncedSave();
    }
  }, [debouncedSave, canvasReady]);

  // Handle download
  const handleDownload = useCallback(() => {
    console.log("Download button clicked");
    if (!excalidrawAPIRef.current) {
      console.error("Excalidraw API reference is not available");
      toast({
        title: "Error",
        description: "Drawing canvas is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();

      const content = JSON.stringify({
        elements,
        appState,
      });

      const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
        content
      )}`;
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${name}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (err) {
      console.error("Error downloading drawing:", err);
      toast({
        title: "Error",
        description: "Could not download drawing. Please try again.",
        variant: "destructive",
      });
    }
  }, [excalidrawAPIRef, name, toast]);

  // Add this effect for proper cleanup
  useEffect(() => {
    return () => {
      console.log("Component unmounting, cancelling debounced save");
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Check if canvas is ready periodically
  useEffect(() => {
    if (!isExcalidrawLoaded) return;

    let checkAttempts = 0;
    const maxAttempts = 10;

    const checkCanvasReady = () => {
      if (excalidrawAPIRef.current) {
        try {
          // Test if we can access the API methods
          const elements = excalidrawAPIRef.current.getSceneElements();
          const appState = excalidrawAPIRef.current.getAppState();

          if (elements && appState) {
            console.log("Canvas is ready!", { elementsCount: elements.length });
            setCanvasReady(true);
            return true;
          }
        } catch (err) {
          console.log("Canvas not ready yet, will retry...");
        }
      }

      checkAttempts++;
      if (checkAttempts >= maxAttempts) {
        console.error("Canvas failed to initialize after multiple attempts");
        toast({
          title: "Warning",
          description:
            "Drawing canvas may not be fully initialized. Save functionality might be limited.",
          variant: "destructive",
        });
        return true;
      }

      return false;
    };

    // Initial check
    if (checkCanvasReady()) return;

    // Set up interval for checking
    const intervalId = setInterval(() => {
      if (checkCanvasReady()) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isExcalidrawLoaded, toast]);

  // Log when component mounts
  useEffect(() => {
    console.log("DrawingEditor component mounted", {
      hasInitialData: !!initialData,
      initialName: initialData?.name || "Untitled Drawing",
    });
  }, [initialData]);

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-xs"
            placeholder="Drawing name"
          />
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-sm text-muted-foreground">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!canvasReady}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={handleSaveClick}
            disabled={isSaving || !canvasReady}
            className="bg-primary hover:bg-primary/90 relative"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
            {!canvasReady && !isSaving && (
              <span className="absolute -top-8 right-0 text-xs bg-background border px-2 py-1 rounded shadow-sm whitespace-nowrap">
                Canvas loading...
              </span>
            )}
          </Button>
        </div>
      </div>
      <div className="flex-1 w-full">
        <div className="h-full w-full">
          <ExcalidrawComponent
            ref={(api) => {
              excalidrawAPIRef.current = api;
              console.log("Excalidraw ref set:", !!api);
              if (api) {
                setIsExcalidrawLoaded(true);
              }
            }}
            initialData={initialContent}
            onChange={handleChange}
            zenModeEnabled={false}
            gridModeEnabled={true}
            onMount={() => {
              console.log("Excalidraw component mounted");
              // We'll check if the canvas is ready in the useEffect
            }}
          />
        </div>
      </div>
    </div>
  );
}
