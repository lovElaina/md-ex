import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 尝试执行一个简单的查询
    await prisma.$queryRaw`SELECT 1+1`;
    return NextResponse.json({ status: "数据库连接正常" });
  } catch (error) {
    console.error("数据库连接测试错误:", error);
    return NextResponse.json(
      { 
        error: "数据库连接失败", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 