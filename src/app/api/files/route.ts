import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 获取所有文件列表
export async function GET() {
  try {
    const files = await prisma.markdownFile.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        content: true,
        folderId: true,
        updatedAt: true,
      },
    });

    // 添加类型信息
    const filesWithType = files.map(file => ({
      ...file,
      type: 'file' as const,
    }));

    return NextResponse.json(filesWithType);
  } catch (error) {
    console.error("获取文件列表错误:", error);
    return NextResponse.json(
      { error: "获取文件列表失败", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 创建新文件
export async function POST(request: Request) {
  try {
    const { title, content } = await request.json();
    const file = await prisma.markdownFile.create({
      data: {
        title,
        content,
      },
    });
    return NextResponse.json(file);
  } catch (error) {
    console.error("创建文件错误:", error);
    return NextResponse.json(
      { error: "创建文件失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 