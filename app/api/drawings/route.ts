import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("Unauthorized access attempt to GET /api/drawings");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    console.log("Fetching drawings for user:", session.user.id);

    const drawings = await prisma.drawing.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    console.log(`Found ${drawings.length} drawings`);
    return NextResponse.json(drawings);
  } catch (error) {
    console.error("Error fetching drawings:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to fetch drawings",
        details: String(error),
      }),
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  console.log("POST /api/drawings received");

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("Unauthorized access attempt to POST /api/drawings");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    console.log("Creating drawing for user:", session.user.id);

    const body = await request.json();
    const { name, content } = body;

    console.log("Request body received:", {
      name,
      contentLength: content?.length || 0,
    });

    if (!name || !content) {
      console.log("Missing required fields:", {
        hasName: !!name,
        hasContent: !!content,
      });
      return new NextResponse(
        JSON.stringify({ error: "Name and content are required" }),
        {
          status: 400,
        }
      );
    }

    // Check if user is on free plan and has reached limit
    const userWithCount = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        _count: {
          select: {
            drawings: true,
          },
        },
      },
    });

    console.log("User plan check:", {
      plan: userWithCount?.plan,
      drawingCount: userWithCount?._count.drawings || 0,
    });

    if (userWithCount?.plan === "FREE" && userWithCount._count.drawings >= 5) {
      console.log("Free plan limit reached");
      return new NextResponse(
        JSON.stringify({
          error:
            "Free plan limit reached. Please upgrade to Pro for unlimited drawings.",
        }),
        { status: 403 }
      );
    }

    console.log("Creating drawing in database");
    const drawing = await prisma.drawing.create({
      data: {
        name: name || "Untitled Drawing",
        content,
        userId: session.user.id,
      },
    });

    console.log("Drawing created:", drawing.id);
    return NextResponse.json(drawing);
  } catch (error) {
    console.error("Error creating drawing:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to create drawing",
        details: String(error),
      }),
      {
        status: 500,
      }
    );
  }
}
