import React, { useState, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import {FolderPlus, FilePlus, FileUpIcon, Upload} from "lucide-react";
import Dialog from "./Dialog";
import FileTreeItem, { FolderType, MarkdownFileType } from "./FileTreeItem";

type FileListProps = {
  selectedFile: string | null;
  onFileSelect: (fileId: string) => void;
  className?: string;
};

type MarkdownFile = {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  updatedAt: string;
  type: 'file';
};

type Folder = {
  id: string;
  title: string;
  files: MarkdownFile[];
  type: 'folder';
};

type FileOperation = {
  type: 'file';
  action: 'rename' | 'delete';
  item: MarkdownFile;
};

type FolderOperation = {
  type: 'folder';
  action: 'rename' | 'delete';
  item: Folder;
};

type Operation = FileOperation | FolderOperation;

const FileList = ({ selectedFile, onFileSelect, className }: FileListProps) => {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentOperation, setCurrentOperation] = useState<Operation | null>(null);
  const [error, setError] = useState<string>("");
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedItem, setDraggedItem] = useState<MarkdownFileType | null>(null);

  // 管理所有展开的文件夹 ID
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // 管理根目录的拖放状态
  const [isRootDragOver, setIsRootDragOver] = useState<boolean>(false);

  useEffect(() => {
    refreshData();
  }, []);

  // 封装刷新数据的方法
  const refreshData = async () => {
    try {
      await Promise.all([fetchFiles(), fetchFolders()]);
    } catch (err) {
      console.error("刷新数据失败:", err);
      setError("刷新数据失败，请稍后重试。");
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files");
      if (!response.ok) {
        throw new Error("获取文件失败");
      }
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("获取文件失败:", error);
      setError("获取文件失败，请稍后重试。");
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/folders");
      if (!response.ok) {
        throw new Error("获取文件夹失败");
      }
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error("获取文件夹失败:", error);
      setError("获取文件夹失败，请稍后重试。");
    }
  };

  const isFileNameExists = (title: string, excludeId?: string) => {
    return files.some(file =>
        file.title.toLowerCase() === title.toLowerCase() && file.id !== excludeId
    );
  };

  const isFolderNameExists = (title: string, excludeId?: string) => {
    return folders.some(folder =>
        folder.title.toLowerCase() === title.toLowerCase() && folder.id !== excludeId
    );
  };

  // 重命名文件的逻辑
  const handleFileRename = async (fileId: string, newTitle: string) => {
    if (isFileNameExists(newTitle, fileId)) {
      setError(`文件名 "${newTitle}" 已存在，请使用其他名称`);
      return false;
    }

    const file = files.find(f => f.id === fileId) || folders.flatMap(folder => folder.files).find(f => f.id === fileId);
    if (!file) return false;

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: file.content,
        }),
      });

      if (response.ok) {
        await refreshData(); // 使用封装的方法刷新数据
        return true;
      }
    } catch (error) {
      console.error("重命名文件失败:", error);
      setError("重命名文件失败，请稍后重试。");
    }
    return false;
  };

  // 处理删除文件的逻辑
  const handleFileDelete = async (fileId: string) => {
    try {
      //files.find(f => f.id === fileId) || folders.flatMap(folder => folder.files).find(f => f.id === fileId);
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (selectedFile === fileId) {
          onFileSelect("");
        }
        await refreshData(); // 使用封装的方法刷新数据
        return true;
      }
    } catch (error) {
      console.error("删除文件失败:", error);
      setError("删除文件失败，请稍后重试。");
    }
    return false;
  };

  // 处理重命名文件夹的逻辑
  const handleFolderRename = async (folderId: string, newTitle: string) => {
    if (isFolderNameExists(newTitle, folderId)) {
      setError(`文件夹名称 "${newTitle}" 已存在，请使用其他名称`);
      return false;
    }

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        await refreshData(); // 使用封装的方法刷新数据
        return true;
      }
    } catch (error) {
      console.error("重命名文件夹失败:", error);
      setError("重命名文件夹失败，请稍后重试。");
    }
    return false;
  };

  // 处理删除文件夹的逻辑
  const handleFolderDelete = async (folderId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await refreshData(); // 使用封装的方法刷新数据
        return true;
      }
    } catch (error) {
      console.error("删除文件夹失败:", error);
      setError("删除文件夹失败，请稍后重试。");
    }
    return false;
  };

  // 控制中枢，处理所有指令
  const handleOperation = async (newTitle?: string) => {
    if (!currentOperation) return false;

    if (currentOperation.type === 'file') {
      if (currentOperation.action === 'rename' && newTitle) {
        return await handleFileRename(currentOperation.item.id, newTitle);
      } else if (currentOperation.action === 'delete') {
        return await handleFileDelete(currentOperation.item.id);
      }
    } else {
      if (currentOperation.action === 'rename' && newTitle) {
        return await handleFolderRename(currentOperation.item.id, newTitle);
      } else if (currentOperation.action === 'delete') {
        return await handleFolderDelete(currentOperation.item.id);
      }
    }
    return false;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";

    const title = file.name.replace(/\.md$/, "");
    if (isFileNameExists(title)) {
      console.log(isAlertDialogOpen)
      setIsAlertDialogOpen(true);
      //setError(`文件名 "${title}" 已存在，请使用其他名称`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;

      try {
        const response = await fetch("/api/files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            content,
          }),
        });

        if (response.ok) {
          await refreshData(); // 使用封装的方法刷新数据
        }
      } catch (error) {
        console.error("上传文件失败:", error);
        setError("上传文件失败，请稍后重试。");
      }
    };

    reader.readAsText(file);
  };

  const handleCreateNewFile = async (title: string) => {
    if (isFileNameExists(title)) {
      setError(`文件名 "${title}" 已存在，请使用其他名称`);
      return false;
    }

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content: "",
        }),
      });

      if (response.ok) {
        const newFile = await response.json();
        await refreshData(); // 使用封装的方法刷新数据
        onFileSelect(newFile.id);
        return true;
      }
    } catch (error) {
      console.error("创建文件失败:", error);
      setError("创建文件失败，请稍后重试。");
    }
    return false;
  };

  const handleCreateFolder = async (title: string) => {
    if (isFolderNameExists(title)) {
      setError(`文件夹名称 "${title}" 已存在，请使用其他名称`);
      return false;
    }

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        await refreshData(); // 使用封装的方法刷新数据
        return true;
      }
    } catch (error) {
      console.error("创建文件夹失败:", error);
      setError("创建文件夹失败，请稍后重试。");
    }
    return false;
  };

  const handleStartDrag = (item: FolderType | MarkdownFileType) => {
    if (item.type === 'file') {
      setDraggedItem(item);
    }
  };

  // 修改 handleDrop 函数，使其能够处理 'root' 作为目标
  const handleDrop = async (targetFolderId: string) => {
    if (!draggedItem) return;

    try {
      const response = await fetch(`/api/files/${draggedItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: targetFolderId === 'root' ? null : targetFolderId,
        }),
      });

      if (response.ok) {
        await refreshData(); // 使用封装的方法刷新数据
        setDraggedItem(null);
      }
    } catch (error) {
      console.error("移动文件失败:", error);
      setError("移动文件失败，请稍后重试。");
    }
  };

  // 切换文件夹展开状态
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // 处理根目录的拖放事件
  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(true);
  };

  const handleRootDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
  };

  const handleRootDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
    if (!draggedItem) return;

    try {
      const response = await fetch(`/api/files/${draggedItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: null, // 将文件移动到根目录
        }),
      });

      if (response.ok) {
        await refreshData();
        setDraggedItem(null);
      }
    } catch (error) {
      console.error("移动文件到根目录失败:", error);
      setError("移动文件失败，请稍后重试。");
    }
  };

  const renderFileTreeItem = (item: FolderType | MarkdownFileType, level = 0) => {
    const itemType = item.type;
    if (itemType === 'file' || itemType === 'folder') {
      const isExpanded = itemType === 'folder' && expandedFolders.has(item.id);
      return (
          <div key={item.id}>
            <FileTreeItem
                item={item}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
                onStartDrag={handleStartDrag}
                onDrop={handleDrop}
                onRename={() => {
                  setError("");
                  if (itemType === 'folder') {
                    setCurrentOperation({
                      type: 'folder',
                      action: 'rename',
                      item: item as Folder,
                    });
                  } else {
                    setCurrentOperation({
                      type: 'file',
                      action: 'rename',
                      item: item as MarkdownFile,
                    });
                  }
                }}
                onDelete={() => {
                  setError("");
                  if (itemType === 'folder') {
                    setCurrentOperation({
                      type: 'folder',
                      action: 'delete',
                      item: item as Folder,
                    });
                  } else {
                    setCurrentOperation({
                      type: 'file',
                      action: 'delete',
                      item: item as MarkdownFile,
                    });
                  }
                }}
                level={level}
                isExpanded={isExpanded} // 传递展开状态
                onToggle={() => toggleFolder(item.id)} // 传递切换方法
            />
            {/* 仅当文件夹展开时渲染子文件 */}
            {item.type === "folder" && isExpanded && item.files.map(file => renderFileTreeItem(file, level + 1))}
          </div>
      )
    }
  };

  return (
      <>
        <div className={twMerge("p-4", className)}>
          <div className="flex  items-center justify-between mb-4">
            <div className="flex flex-col gap-2 flex-1">
              <button
                  className="px-3 py-3 text-sm bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center"
                  onClick={() => {
                    setError("");
                    setIsNewFolderDialogOpen(true);
                  }}
              >
                <FolderPlus size={16} className="mr-1" />
                新建文件夹
              </button>
              <button
                  className="px-3 py-3 text-sm bg-blue-500 text-white  hover:bg-blue-600 flex items-center justify-center"
                  onClick={() => {
                    setError("");
                    setIsNewFileDialogOpen(true);
                  }}
              >
                <FilePlus size={16} className="mr-1" />
                新建文件
              </button>
              <button
                  className="px-3 py-3 text-sm bg-blue-500 text-white  hover:bg-blue-600 flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} className="mr-1" />
                上传文件
              </button>
            </div>
          </div>
          <input
              type="file"
              ref={fileInputRef}
              accept=".md"
              className="hidden"
              onChange={handleFileUpload}
          />
          {/* 根目录作为可拖放区域 */}
          <div
              className={twMerge(
                  "space-y-1 p-2",
                  isRootDragOver ? "bg-blue-50 border border-blue-300" : ""
              )}
              onDragOver={handleRootDragOver}
              onDragLeave={handleRootDragLeave}
              onDrop={handleRootDrop}
          >
            {folders.map(folder => renderFileTreeItem(folder))}
            {files
                .filter(file => !file.folderId)
                .map(file => renderFileTreeItem({ ...file, type: 'file' }))}
          </div>
        </div>

        {/* Dialog 组件 */}
        <Dialog
            isOpen={isNewFileDialogOpen}
            onClose={() => {
              setIsNewFileDialogOpen(false);
              setError("");
            }}
            onConfirm={handleCreateNewFile}
            title="新建文档"
            placeholder="请输入文档名称"
            error={error}
            type="input"
        />

        <Dialog
            isOpen={currentOperation?.action === 'rename'}
            onClose={() => {
              setCurrentOperation(null);
              setError("");
            }}
            onConfirm={handleOperation}
            title={`重命名${currentOperation?.type === 'folder' ? '文件夹' : '文件'}`}
            placeholder="请输入新名称"
            initialValue={currentOperation?.item.title}
            error={error}
            type="input"
        />

        <Dialog
            isOpen={currentOperation?.action === 'delete'}
            onClose={() => setCurrentOperation(null)}
            onConfirm={handleOperation}
            title={`删除${currentOperation?.type === 'folder' ? '文件夹' : '文件'}`}
            description={`确定要删除${currentOperation?.type === 'folder' ? '文件夹' : '文件'} "${currentOperation?.item.title}" 吗？${
                currentOperation?.type === 'folder' ? '文件夹中的所有文都将被删除。' : ''
            }此操作不可撤销。`}
            type="confirm"
            confirmText="删除"
            confirmButtonClass="bg-red-500 hover:bg-red-600"
        />

        <Dialog
            isOpen={isNewFolderDialogOpen}
            onClose={() => {
              setIsNewFolderDialogOpen(false);
              setError("");
            }}
            onConfirm={handleCreateFolder}
            title="新建文件夹"
            placeholder="请输入文件夹名称"
            error={error}
            type="input"
        />

        <Dialog
            isOpen={isAlertDialogOpen}
            onClose={() => {
              setIsAlertDialogOpen(false);
              setError("");
            }}
            type="error"
            confirmText="确定"
            onConfirm={() => {
              setIsAlertDialogOpen(false);
              setError("");
            }}
            title="错误"
            description="文件名重复"
            confirmButtonClass="bg-red-500 hover:bg-red-600"
        />
      </>
  );
};

export default FileList;
