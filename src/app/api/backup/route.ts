import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const files = await prisma.markdownFile.findMany();
    
    // 将数据保存到项目根目录的 backup.json 文件
    await fs.writeFile(
      path.join(process.cwd(), 'backup.json'),
      JSON.stringify(files, null, 2)
    );

    return NextResponse.json({ message: "备份成功" });
  } catch (error) {
    return NextResponse.json({ error: "备份失败" }, { status: 500 });
  }
} 