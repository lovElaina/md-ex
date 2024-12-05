import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 首先删除文件夹中的所有文件
    await prisma.markdownFile.deleteMany({
      where: {
        folderId: params.id,
      },
    });

    // 然后删除文件夹
    await prisma.folder.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "删除文件夹失败" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title } = await request.json();
    const folder = await prisma.folder.update({
      where: {
        id: params.id,
      },
      data: {
        title,
      },
    });
    return NextResponse.json(folder);
  } catch (error) {
    return NextResponse.json({ error: "更新文件夹失败" }, { status: 500 });
  }
}
