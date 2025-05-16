"use client";

import type React from "react";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Save,
  ArrowLeft,
  Download,
  Trash,
  Square,
  Circle,
  Pencil,
  Type,
  MousePointer,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Drawing } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Tool = "pencil" | "rectangle" | "circle" | "text" | "select" | "eraser";
type FontFamily = "Arial" | "Courier" | "Times New Roman" | "Comic Sans MS";
type FontStyle = {
  family: FontFamily;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

type DrawingAction = {
  tool: Tool;
  points?: { x: number; y: number }[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  color?: string;
  text?: string;
  width?: number;
  height?: number;
  fontStyle?: FontStyle;
};

interface SimpleDrawingCanvasProps {
  initialData: Drawing | null;
}

export function SimpleDrawingCanvas({ initialData }: SimpleDrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const textInputContainerRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState(initialData?.name || "Untitled Drawing");
  const [currentTool, setCurrentTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#000000");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [actions, setActions] = useState<DrawingAction[]>([]);
  const [actionHistory, setActionHistory] = useState<DrawingAction[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingAction[][]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState("");
  const [fontStyle, setFontStyle] = useState<FontStyle>({
    family: "Arial",
    size: 16,
    bold: false,
    italic: false,
    underline: false,
  });

  const router = useRouter();
  const { toast } = useToast();

  // Parse initial content if available
  useEffect(() => {
    if (initialData?.content) {
      try {
        const content = JSON.parse(initialData.content);
        if (content.actions) {
          setActions(content.actions);
          setActionHistory([content.actions]);
        }
      } catch (error) {
        console.error("Error parsing initial content:", error);
      }
    }
  }, [initialData]);

  // Draw all actions on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all actions
    actions.forEach((action) => {
      ctx.strokeStyle = action.color || "#000000";
      ctx.lineWidth = 2;
      ctx.fillStyle = action.color || "#000000";

      if (action.tool === "pencil" && action.points) {
        ctx.beginPath();
        const [first, ...rest] = action.points;
        ctx.moveTo(first.x, first.y);
        rest.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      } else if (
        action.tool === "rectangle" &&
        action.startX !== undefined &&
        action.startY !== undefined &&
        action.width !== undefined &&
        action.height !== undefined
      ) {
        ctx.strokeRect(
          action.startX,
          action.startY,
          action.width,
          action.height
        );
      } else if (
        action.tool === "circle" &&
        action.startX !== undefined &&
        action.startY !== undefined &&
        action.width !== undefined &&
        action.height !== undefined
      ) {
        ctx.beginPath();
        const centerX = action.startX + action.width / 2;
        const centerY = action.startY + action.height / 2;
        const radiusX = Math.abs(action.width / 2);
        const radiusY = Math.abs(action.height / 2); // Declared height variable here
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (
        action.tool === "text" &&
        action.text &&
        action.startX !== undefined &&
        action.startY !== undefined
      ) {
        const fontStyle = action.fontStyle || {
          family: "Arial",
          size: 16,
          bold: false,
          italic: false,
          underline: false,
        };

        // Set font style
        const fontString = `${fontStyle.bold ? "bold " : ""}${
          fontStyle.italic ? "italic " : ""
        }${fontStyle.size}px ${fontStyle.family}`;
        ctx.font = fontString;
        ctx.fillText(action.text, action.startX, action.startY);

        // Draw underline if needed
        if (fontStyle.underline) {
          const textMetrics = ctx.measureText(action.text);
          const textWidth = textMetrics.width;
          const underlineY = action.startY + 3;
          ctx.beginPath();
          ctx.moveTo(action.startX, underlineY);
          ctx.lineTo(action.startX + textWidth, underlineY);
          ctx.stroke();
        }
      }
    });
  }, [actions]);

  // Draw preview shape on preview canvas
  const drawPreview = useCallback(
    (currentX: number, currentY: number) => {
      const canvas = previewCanvasRef.current;
      if (!canvas || !startPoint) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear preview canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillStyle = color;

      const width = currentX - startPoint.x;
      const height = currentY - startPoint.y;

      if (currentTool === "rectangle") {
        ctx.strokeRect(startPoint.x, startPoint.y, width, height);
      } else if (currentTool === "circle") {
        ctx.beginPath();
        const centerX = startPoint.x + width / 2;
        const centerY = startPoint.y + height / 2;
        const radiusX = Math.abs(width / 2);
        const radiusY = Math.abs(height / 2);
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    },
    [startPoint, currentTool, color]
  );

  // Redraw canvas when actions change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        previewCanvas.width = container.clientWidth;
        previewCanvas.height = container.clientHeight;
        redrawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [redrawCanvas]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when text input is active
      if (showTextInput) return;

      // Tool shortcuts
      if (e.key === "p") setCurrentTool("pencil");
      if (e.key === "r") setCurrentTool("rectangle");
      if (e.key === "c") setCurrentTool("circle");
      if (e.key === "t") setCurrentTool("text");
      if (e.key === "v") setCurrentTool("select");
      if (e.key === "e") setCurrentTool("eraser");

      // Undo/Redo
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
      }

      // Save
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        handleSave();
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showTextInput]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });

    if (currentTool === "pencil") {
      const newAction: DrawingAction = {
        tool: "pencil",
        color,
        points: [{ x, y }],
      };

      setActions((prev) => [...prev, newAction]);
    } else if (currentTool === "text") {
      // Show text input at click position
      setTextInputPosition({ x, y });
      setShowTextInput(true);
      setTextInputValue("");

      // Focus the text input after it's shown
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 10);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === "pencil") {
      setActions((prev) => {
        const newActions = [...prev];
        const lastAction = newActions[newActions.length - 1];
        if (lastAction && lastAction.tool === "pencil" && lastAction.points) {
          lastAction.points.push({ x, y });
        }
        return newActions;
      });
      redrawCanvas();
    } else if (currentTool === "rectangle" || currentTool === "circle") {
      // Draw preview shape
      drawPreview(x, y);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Clear preview canvas
    const previewCtx = previewCanvas.getContext("2d");
    if (previewCtx) {
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    }

    if (currentTool === "rectangle") {
      const width = x - startPoint.x;
      const height = y - startPoint.y;
      const newAction: DrawingAction = {
        tool: "rectangle",
        startX: startPoint.x,
        startY: startPoint.y,
        width,
        height,
        color,
      };

      // Save to history before adding new action
      setActionHistory((prev) => [...prev, [...actions]]);
      setRedoStack([]);

      setActions((prev) => [...prev, newAction]);
    } else if (currentTool === "circle") {
      const width = x - startPoint.x;
      const height = y - startPoint.y;
      const newAction: DrawingAction = {
        tool: "circle",
        startX: startPoint.x,
        startY: startPoint.y,
        width,
        height,
        color,
      };

      // Save to history before adding new action
      setActionHistory((prev) => [...prev, [...actions]]);
      setRedoStack([]);

      setActions((prev) => [...prev, newAction]);
    } else if (currentTool === "pencil") {
      // Save to history after completing a pencil stroke
      setActionHistory((prev) => [...prev, [...actions]]);
      setRedoStack([]);
    }

    setIsDrawing(false);
    setStartPoint(null);
    redrawCanvas();
  };

  // Handle text input submission
  const handleTextSubmit = () => {
    if (!textInputValue.trim() || !textInputPosition) return;

    const newAction: DrawingAction = {
      tool: "text",
      startX: textInputPosition.x,
      startY: textInputPosition.y,
      text: textInputValue,
      color,
      fontStyle: { ...fontStyle },
    };

    // Save to history before adding new action
    setActionHistory((prev) => [...prev, [...actions]]);
    setRedoStack([]);

    setActions((prev) => [...prev, newAction]);
    setShowTextInput(false);
    setTextInputValue("");
    redrawCanvas();
  };

  // Handle undo
  const handleUndo = () => {
    if (actionHistory.length === 0) return;

    const previousState = actionHistory[actionHistory.length - 1];
    const newHistory = actionHistory.slice(0, -1);

    setRedoStack((prev) => [...prev, [...actions]]);
    setActions(previousState);
    setActionHistory(newHistory);
  };

  // Handle redo
  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    setActionHistory((prev) => [...prev, [...actions]]);
    setActions(nextState);
    setRedoStack(newRedoStack);
  };

  // Save drawing
  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log("Save button clicked");

      const content = JSON.stringify({
        actions,
        version: "1.0",
      });

      console.log("Preparing to save drawing", {
        name,
        actionsCount: actions.length,
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

  // Handle download
  const handleDownload = () => {
    try {
      const content = JSON.stringify({
        actions,
        version: "1.0",
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
    } catch (error) {
      console.error("Error downloading drawing:", error);
      toast({
        title: "Error",
        description: "Failed to download drawing. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Clear canvas
  const handleClear = () => {
    if (
      confirm(
        "Are you sure you want to clear the canvas? This cannot be undone."
      )
    ) {
      // Save current state to history before clearing
      setActionHistory((prev) => [...prev, [...actions]]);
      setRedoStack([]);

      setActions([]);
      redrawCanvas();
    }
  };

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
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="border-b p-2 flex items-center gap-2 flex-wrap">
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentTool === "pencil" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentTool("pencil")}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Pencil (P)</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pencil (P)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentTool === "rectangle" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentTool("rectangle")}
                  className="h-8 w-8 p-0"
                >
                  <Square className="h-4 w-4" />
                  <span className="sr-only">Rectangle (R)</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rectangle (R)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentTool === "circle" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentTool("circle")}
                  className="h-8 w-8 p-0"
                >
                  <Circle className="h-4 w-4" />
                  <span className="sr-only">Circle (C)</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Circle (C)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentTool === "text" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentTool("text")}
                  className="h-8 w-8 p-0"
                >
                  <Type className="h-4 w-4" />
                  <span className="sr-only">Text (T)</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Text (T)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentTool === "select" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentTool("select")}
                  className="h-8 w-8 p-0"
                >
                  <MousePointer className="h-4 w-4" />
                  <span className="sr-only">Select (V)</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Select (V)</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-6 border-l mx-2"></div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={actionHistory.length === 0}
                  className="h-8 w-8 p-0"
                >
                  <Undo className="h-4 w-4" />
                  <span className="sr-only">Undo (Ctrl+Z)</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="h-8 w-8 p-0"
                >
                  <Redo className="h-4 w-4" />
                  <span className="sr-only">Redo (Ctrl+Shift+Z)</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-6 border-l mx-2"></div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-md border flex items-center justify-center overflow-hidden">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 cursor-pointer"
                      style={{ margin: "-2px" }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>Color</TooltipContent>
            </Tooltip>
          </div>

          {currentTool === "text" && (
            <>
              <div className="h-6 border-l mx-2"></div>

              <div className="flex items-center gap-2">
                <Select
                  value={fontStyle.family}
                  onValueChange={(value) =>
                    setFontStyle((prev) => ({
                      ...prev,
                      family: value as FontFamily,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue placeholder="Font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Courier">Courier</SelectItem>
                    <SelectItem value="Times New Roman">Times</SelectItem>
                    <SelectItem value="Comic Sans MS">Comic Sans</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={fontStyle.size.toString()}
                  onValueChange={(value) =>
                    setFontStyle((prev) => ({
                      ...prev,
                      size: Number.parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12px</SelectItem>
                    <SelectItem value="16">16px</SelectItem>
                    <SelectItem value="20">20px</SelectItem>
                    <SelectItem value="24">24px</SelectItem>
                    <SelectItem value="32">32px</SelectItem>
                  </SelectContent>
                </Select>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={fontStyle.bold ? "default" : "ghost"}
                      size="sm"
                      onClick={() =>
                        setFontStyle((prev) => ({ ...prev, bold: !prev.bold }))
                      }
                      className="h-8 w-8 p-0"
                    >
                      <Bold className="h-4 w-4" />
                      <span className="sr-only">Bold</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bold</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={fontStyle.italic ? "default" : "ghost"}
                      size="sm"
                      onClick={() =>
                        setFontStyle((prev) => ({
                          ...prev,
                          italic: !prev.italic,
                        }))
                      }
                      className="h-8 w-8 p-0"
                    >
                      <Italic className="h-4 w-4" />
                      <span className="sr-only">Italic</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Italic</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={fontStyle.underline ? "default" : "ghost"}
                      size="sm"
                      onClick={() =>
                        setFontStyle((prev) => ({
                          ...prev,
                          underline: !prev.underline,
                        }))
                      }
                      className="h-8 w-8 p-0"
                    >
                      <Underline className="h-4 w-4" />
                      <span className="sr-only">Underline</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Underline</TooltipContent>
                </Tooltip>
              </div>
            </>
          )}

          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="h-8"
            >
              <Trash className="h-4 w-4 mr-1" />
              Clear Canvas
            </Button>
          </div>
        </TooltipProvider>
      </div>

      <div className="flex-1 w-full bg-white relative">
        {/* Main canvas for final drawings */}
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair absolute top-0 left-0 z-10"
        />

        {/* Preview canvas for real-time shape drawing */}
        <canvas
          ref={previewCanvasRef}
          className="w-full h-full cursor-crosshair absolute top-0 left-0 z-20"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Floating text input */}
        {showTextInput && (
          <div
            ref={textInputContainerRef}
            className="absolute z-30 bg-white border shadow-md rounded-md p-2"
            style={{
              left: textInputPosition.x,
              top: textInputPosition.y,
              minWidth: "200px",
            }}
          >
            <textarea
              ref={textInputRef}
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter text..."
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSubmit();
                }
                if (e.key === "Escape") {
                  setShowTextInput(false);
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTextInput(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleTextSubmit}>
                Add Text
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
