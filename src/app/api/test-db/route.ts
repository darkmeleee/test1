import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET() {
  try {
    // Check if we can connect to the database
    const userCount = await db.user.count();
    const orderCount = await db.order.count();
    
    // Get recent users and orders
    const recentUsers = await db.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        username: true,
        createdAt: true,
      }
    });
    
    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      database: {
        userCount,
        orderCount,
        recentUsers,
        recentOrders,
      }
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
