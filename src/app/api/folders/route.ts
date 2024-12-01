import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        files: {
          select: {
            id: true,
            title: true,
            content: true,
            folderId: true,
            updatedAt: true,
          },
        },
      },
    });

    const foldersWithType = folders.map(folder => ({
      ...folder,
      type: 'folder' as const,
      files: folder.files.map(file => ({
        ...file,
        type: 'file' as const,
      })),
    }));

    return NextResponse.json(foldersWithType);
  } catch (error) {
    console.error("获取文件夹错误:", error);
    return NextResponse.json(
      { error: "获取文件夹失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    const folder = await prisma.folder.create({
      data: {
        title,
      },
    });
    return NextResponse.json(folder);
  } catch (error) {
    console.error("创建文件夹错误:", error);
    return NextResponse.json(
      { error: "创建文件夹失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 