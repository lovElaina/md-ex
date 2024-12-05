// components/MilestoneList.tsx

"use client";

import React, {useCallback, useEffect, useState} from "react";
import {Milestone} from "@prisma/client";
import {Trash2, MilestoneIcon, GitBranchPlus} from "lucide-react";
import {toast} from "react-toastify";
import Dialog from "@/components/Dialog";
import {twMerge} from "tailwind-merge";


type MilestoneWithoutContent = {
    id: string;
    name: string;
    createdAt: string;
}

type MilestoneListProps = {
    fileId: string,
    currentMarkdown: string,
    onSelectMilestone: (milestone: MilestoneWithoutContent & { content: string }) => void,
    className?: string
}

const MilestoneList = ({
                           fileId,
                           currentMarkdown,
                           onSelectMilestone,
                            className
                       }: MilestoneListProps) => {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [newMilestoneName, setNewMilestoneName] = useState("");
    const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);

    const fetchMilestones = useCallback(async () => {
        try {
            const response = await fetch(`/api/files/${fileId}/milestones`);
            const data = await response.json();

            setMilestones(data);
        } catch (error) {
            console.error("获取里程碑失败:", error);
        }
    }, [fileId]);

    useEffect(() => {
        console.log(fileId);
        fetchMilestones();
    }, [fetchMilestones, fileId]);


    const createMilestone = async () => {
        if (!newMilestoneName.trim()) {
            toast.error("请输入里程碑名称")
            return;
        }

        try {
            const response = await fetch(`/api/files/${fileId}/milestones`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newMilestoneName,
                    content: currentMarkdown, // 传入当前 Markdown 内容
                }),
            });

            if (response.ok) {
                setNewMilestoneName("");
                fetchMilestones();
            } else {
                const errorData = await response.json();
                toast.error(`创建里程碑失败:<br>${errorData.error}` )
                console.error("创建里程碑失败:", errorData.error);
            }
        } catch (error) {
            console.error("创建里程碑失败:", error);
        }
    };

    const handleSelect = async (milestone: Milestone) => {
        try {
            const response = await fetch(`/api/files/${fileId}/milestones/${milestone.id}`);
            if (response.ok) {
                const data: MilestoneWithoutContent & { content: string } = await response.json();
                onSelectMilestone(data);
            } else {
                const errorData = await response.json();
                console.error("获取里程碑内容失败:", errorData.error);
            }
        } catch (error) {
            console.error("获取里程碑内容失败:", error);
        }
    };

    const handleDelete = async (milestoneId: string | undefined) => {
        //if (!window.confirm("确定要删除此里程碑吗？")) return;
        setCurrentMilestone(null);
        try {
            const response = await fetch(`/api/files/${fileId}/milestones/${milestoneId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setMilestones(milestones.filter((m) => m.id !== milestoneId));
                toast.success("里程碑删除成功")
                return true;
                //console.log("删除里程碑成功");
            } else {
                const errorData = await response.json();
                toast.error("删除里程碑失败:", errorData.error);
                return false;
                //console.error("删除里程碑失败:", errorData.error);
            }
        } catch (error) {
            toast.error("删除里程碑失败",error);
            return false;
            //console.error("删除里程碑失败:", error);
        }
    };

    return (
        <>
        <div className={twMerge("p-4", className)}>
            <h2 className="text-xl font-semibold mb-4">里程碑</h2>
            <ul className="space-y-1">
                {milestones.map((milestone) => (
                    <li
                        key={milestone.id}
                        className="flex items-center justify-between p-2 bg-white shadow hover:bg-gray-100 transition-colors"
                    >
                        <MilestoneIcon size={16} className="mr-1"/>
                        <button
                            onClick={()=>handleSelect(milestone)}
                            className="flex-1 text-left text-blue-600 "
                        >

                            {milestone.name}{" "}
                            <span className="text-sm text-gray-500">
                ({new Date(milestone.createdAt).toLocaleString()})
                            </span>
                        </button>
                        <button
                            onClick={() => setCurrentMilestone(milestone)}
                            className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                            title="删除里程碑"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </li>
                ))}
            </ul>
            <div className="mt-6">
                <input
                    type="text"
                    value={newMilestoneName}
                    onChange={(e) => setNewMilestoneName(e.target.value)}
                    placeholder="新里程碑名称"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                />
                <button
                    onClick={createMilestone}
                    className="mt-2 w-full bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                    <GitBranchPlus size={16} className="mr-2"/>
                    添加里程碑
                </button>
            </div>

            <Dialog
                isOpen={!!currentMilestone}
                onClose={() => {setCurrentMilestone(null)}}
                onConfirm={()=>handleDelete(currentMilestone?.id)}
                title={`替换里程碑`}
                description={`确定删除里程碑"${currentMilestone?.name}"吗？此操作不可撤销`}
                type="confirm"
                confirmText="确定"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            />
        </div>
        </>
    );
};

export default MilestoneList;
