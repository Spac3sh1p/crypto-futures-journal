import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/exchanges/[id] — remove exchange and its trades
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const exchange = await prisma.exchange.findUnique({ where: { id } });
    if (!exchange) {
      return NextResponse.json(
        { success: false, message: "Exchange not found" },
        { status: 404 }
      );
    }

    // Delete associated trades first, then the exchange
    await prisma.trade.deleteMany({ where: { exchangeId: id } });
    await prisma.syncLog.deleteMany({ where: { exchangeId: id } });
    await prisma.exchange.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Exchange deleted" });
  } catch (error) {
    console.error("DELETE /api/exchanges/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete exchange" },
      { status: 500 }
    );
  }
}

// PATCH /api/exchanges/[id] — update label or isActive
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { label, isActive } = body as { label?: string; isActive?: boolean };

    const exchange = await prisma.exchange.findUnique({ where: { id } });
    if (!exchange) {
      return NextResponse.json(
        { success: false, message: "Exchange not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (label !== undefined) updateData.label = label;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.exchange.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        apiKey: "***" + updated.apiKey.slice(-4),
        label: updated.label,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    console.error("PATCH /api/exchanges/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update exchange" },
      { status: 500 }
    );
  }
}
