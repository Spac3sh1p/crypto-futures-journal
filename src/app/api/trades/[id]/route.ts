import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/trades/[id] — update tags, notes, rating
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tags, notes, rating } = body as {
      tags?: string | null;
      notes?: string | null;
      rating?: number | null;
    };

    const trade = await prisma.trade.findUnique({ where: { id } });
    if (!trade) {
      return NextResponse.json(
        { success: false, message: "Trade not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes;
    if (rating !== undefined) updateData.rating = rating;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.trade.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        tags: updated.tags,
        notes: updated.notes,
        rating: updated.rating,
      },
    });
  } catch (error) {
    console.error("PATCH /api/trades/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update trade" },
      { status: 500 }
    );
  }
}
