// src/app/api/files/[fileId]/milestones/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 创建里程碑
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { name, content } = await request.json();

        // 验证请求体
        if (!name || !content) {
            return NextResponse.json(
                { error: "里程碑名称和内容是必需的" },
                { status: 400 }
            );
        }

        // 检查文件是否存在
        const file = await prisma.markdownFile.findUnique({
            where: { id: params.id },
        });

        if (!file) {
            return NextResponse.json({ error: "文件不存在" }, { status: 404 });
        }

        // 创建里程碑
        const milestone = await prisma.milestone.create({
            data: {
                name,
                content,
                markdownFileId: params.id,
            },
        });

        return NextResponse.json(milestone, { status: 201 });
    } catch (error) {
        console.error("创建里程碑失败:", error);
        return NextResponse.json(
            { error: "创建里程碑失败" },
            { status: 500 }
        );
    }
}

// 获取所有里程碑
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {

        // 检查文件是否存在
        const file = await prisma.markdownFile.findUnique({
            where: { id: params.id },
        });

        if (!file) {
            return NextResponse.json({ error: "文件不存在" }, { status: 404 });
        }

        // 获取所有里程碑，按创建时间降序排列
        const milestones = await prisma.milestone.findMany({
            where: { markdownFileId: params.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                createdAt: true,
            },
        });

        return NextResponse.json(milestones, { status: 200 });
    } catch (error) {
        console.error("获取里程碑失败:", error);
        return NextResponse.json(
            { error: "获取里程碑失败" },
            { status: 500 }
        );
    }
}
