// src/app/api/files/[fileId]/milestones/[milestoneId]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 获取特定里程碑
export async function GET(
    request: Request,
    { params }: { params: { id: string; milestoneId: string } }
) {
    try {
        console.log(params)
        // 检查文件是否存在
        const file = await prisma.markdownFile.findUnique({
            where: { id: params.id },
        });

        if (!file) {
            return NextResponse.json({ error: "文件不存在" }, { status: 404 });
        }

        // 获取特定里程碑
        const milestone = await prisma.milestone.findUnique({
            where: { id: params.milestoneId },
        });

        if (!milestone || milestone.markdownFileId !== params.id) {
            return NextResponse.json({ error: "里程碑不存在" }, { status: 404 });
        }

        return NextResponse.json(milestone, { status: 200 });
    } catch (error) {
        console.error("获取里程碑失败:", error);
        return NextResponse.json(
            { error: "获取里程碑失败" },
            { status: 500 }
        );
    }
}

// 删除特定里程碑
export async function DELETE(
    request: Request,
    { params }: { params: { id: string; milestoneId: string } }
) {
    try {
        // 检查文件是否存在
        const file = await prisma.markdownFile.findUnique({
            where: { id: params.id },
        });

        if (!file) {
            return NextResponse.json({ error: "文件不存在" }, { status: 404 });
        }

        // 检查里程碑是否存在
        const milestone = await prisma.milestone.findUnique({
            where: { id: params.milestoneId },
        });

        if (!milestone || milestone.markdownFileId !== params.id) {
            return NextResponse.json({ error: "里程碑不存在" }, { status: 404 });
        }

        // 删除里程碑
        await prisma.milestone.delete({
            where: { id: params.milestoneId },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("删除里程碑失败:", error);
        return NextResponse.json(
            { error: "删除里程碑失败" },
            { status: 500 }
        );
    }
}
