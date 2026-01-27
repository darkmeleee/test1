import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function POST() {
  try {
    // Create a test user
    const testUser = await db.user.create({
      data: {
        telegramId: "123456789",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        photoUrl: "https://via.placeholder.com/100",
        authDate: Math.floor(Date.now() / 1000),
        hash: "test-hash",
      },
    });

    return NextResponse.json({
      success: true,
      user: testUser,
    });
  } catch (error) {
    console.error("Create test user error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
