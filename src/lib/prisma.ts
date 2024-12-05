// src/lib/prisma.ts

import { PrismaClient } from "@prisma/client";

declare global {
    // 允许全局变量
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

// 在开发环境下，防止热重载导致 Prisma 客户端实例过多
if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

export { prisma };
