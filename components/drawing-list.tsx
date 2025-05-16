"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash, MoreVertical, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Drawing } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export function DrawingList() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function fetchDrawings() {
      try {
        console.log("Fetching drawings from API");
        const response = await fetch("/api/drawings");
        console.log("API response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          throw new Error(errorData.error || "Failed to fetch drawings");
        }

        const data = await response.json();
        console.log(`Received ${data.length} drawings from API`);

        if (isMounted) {
          setDrawings(data);
        }
      } catch (error) {
        console.error("Error fetching drawings:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load your drawings. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDrawings();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const handleDelete = async (id: string) => {
    try {
      console.log("Deleting drawing:", id);
      const response = await fetch(`/api/drawings/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to delete drawing");
      }

      setDrawings((prev) => prev.filter((drawing) => drawing.id !== id));
      toast({
        title: "Success",
        description: "Drawing deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting drawing:", error);
      toast({
        title: "Error",
        description: "Failed to delete drawing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (drawing: Drawing) => {
    console.log("Downloading drawing:", drawing.id);
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      drawing.content
    )}`;
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${drawing.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[120px] w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (drawings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            You don't have any drawings yet
          </p>
          <Button onClick={() => router.push("/editor/new")}>
            Create Your First Drawing
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {drawings.map((drawing) => (
        <Card key={drawing.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="truncate">{drawing.name}</CardTitle>
                <CardDescription>
                  Updated{" "}
                  {formatDistanceToNow(new Date(drawing.updatedAt), {
                    addSuffix: true,
                  })}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`/editor/${drawing.id}`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload(drawing)}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Download</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(drawing.id)}>
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="h-[120px] w-full bg-muted rounded-md flex items-center justify-center cursor-pointer"
              onClick={() => router.push(`/editor/${drawing.id}`)}
            >
              {/* Drawing preview would go here */}
              <Pencil className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/editor/${drawing.id}`)}
            >
              Open Drawing
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
