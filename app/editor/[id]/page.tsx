import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SimpleDrawingCanvas } from "@/components/simple-drawing-canvas";

export default async function EditorPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  // Handle "new" drawing
  if (params.id === "new") {
    // Use our simple canvas instead of Excalidraw
    return <SimpleDrawingCanvas initialData={null} />;
  }

  // Fetch existing drawing
  try {
    const drawing = await prisma.drawing.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!drawing) {
      redirect("/dashboard");
    }

    // Use our simple canvas instead of Excalidraw
    return <SimpleDrawingCanvas initialData={drawing} />;
  } catch (error) {
    console.error("Error fetching drawing:", error);
    redirect("/dashboard");
  }
}
