import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    console.log(`Fetching drawing ${params.id} for user ${session.user.id}`);

    const drawing = await prisma.drawing.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!drawing) {
      return new NextResponse(JSON.stringify({ error: "Drawing not found" }), {
        status: 404,
      });
    }

    return NextResponse.json(drawing);
  } catch (error) {
    console.error("Error fetching drawing:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch drawing" }),
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    console.log(`Updating drawing ${params.id} for user ${session.user.id}`);

    const body = await request.json();
    const { name, content } = body;

    if (!name && !content) {
      return new NextResponse(
        JSON.stringify({ error: "Name or content is required" }),
        {
          status: 400,
        }
      );
    }

    // Check if drawing exists and belongs to user
    const existingDrawing = await prisma.drawing.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingDrawing) {
      return new NextResponse(JSON.stringify({ error: "Drawing not found" }), {
        status: 404,
      });
    }

    const drawing = await prisma.drawing.update({
      where: {
        id: params.id,
      },
      data: {
        name: name || existingDrawing.name,
        content: content || existingDrawing.content,
      },
    });

    console.log("Drawing updated successfully");
    return NextResponse.json(drawing);
  } catch (error) {
    console.error("Error updating drawing:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update drawing" }),
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    console.log(`Deleting drawing ${params.id} for user ${session.user.id}`);

    // Check if drawing exists and belongs to user
    const existingDrawing = await prisma.drawing.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingDrawing) {
      return new NextResponse(JSON.stringify({ error: "Drawing not found" }), {
        status: 404,
      });
    }

    await prisma.drawing.delete({
      where: {
        id: params.id,
      },
    });

    console.log("Drawing deleted successfully");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting drawing:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to delete drawing" }),
      {
        status: 500,
      }
    );
  }
}
