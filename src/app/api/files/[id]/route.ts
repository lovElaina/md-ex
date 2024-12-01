import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 获取单个文件内容
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const file = await prisma.markdownFile.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!file) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }
    
    return NextResponse.json(file);
  } catch (error) {
    return NextResponse.json({ error: "获取文件失败" }, { status: 500 });
  }
}

// 更新文件内容
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title, content } = await request.json();
    const file = await prisma.markdownFile.update({
      where: {
        id: params.id,
      },
      data: {
        title,
        content,
      },
    });
    return NextResponse.json(file);
  } catch (error) {
    return NextResponse.json({ error: "更新文件失败" }, { status: 500 });
  }
}

// 删除文件
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.markdownFile.delete({
      where: {
        id: params.id,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "删除文件失败" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { folderId } = await request.json();
    const file = await prisma.markdownFile.update({
      where: {
        id: params.id,
      },
      data: {
        folderId,
      },
    });
    return NextResponse.json(file);
  } catch (error) {
    return NextResponse.json({ error: "移动文件失败" }, { status: 500 });
  }
} 