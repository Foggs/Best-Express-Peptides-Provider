import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminAuth, createUnauthorizedResponse } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const auth = verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Error fetching orders" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = verifyAdminAuth(request)
  if (!auth.valid) {
    return createUnauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status are required" }, { status: 400 })
    }

    const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ error: "Error updating order status" }, { status: 500 })
  }
}
