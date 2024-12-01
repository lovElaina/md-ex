import { useState, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { Pencil, Trash2, FolderPlus, FilePlus } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedItem, setDraggedItem] = useState<MarkdownFileType | null>(null);

  useEffect(() => {
    fetchFiles();
    fetchFolders();
  }, []);

  const fetchFiles = async () => {
    const response = await fetch("/api/files");
    const data = await response.json();
    setFiles(data);
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/folders");
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error("获取文件夹失败:", error);
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

  const handleFileRename = async (fileId: string, newTitle: string) => {
    if (isFileNameExists(newTitle, fileId)) {
      setError(`文件名 "${newTitle}" 已存在，请使用其他名称`);
      return false;
    }

    const file = files.find(f => f.id === fileId);
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
        await fetchFiles();
        return true;
      }
    } catch (error) {
      console.error("重命名文件失败:", error);
    }
    return false;
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (selectedFile === fileId) {
          onFileSelect("");
        }
        await fetchFiles();
        return true;
      }
    } catch (error) {
      console.error("删除文件失败:", error);
    }
    return false;
  };

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
        await fetchFolders();
        return true;
      }
    } catch (error) {
      console.error("重命名文件夹失败:", error);
    }
    return false;
  };

  const handleFolderDelete = async (folderId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await Promise.all([fetchFiles(), fetchFolders()]);
        return true;
      }
    } catch (error) {
      console.error("删除文件夹失败:", error);
    }
    return false;
  };

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

    const title = file.name.replace(/\.md$/, "");
    if (isFileNameExists(title)) {
      alert(`文件名 "${title}" 已存在，请重命名后重试`);
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
          fetchFiles();
        }
      } catch (error) {
        console.error("上传文件失败:", error);
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
        fetchFiles();
        onFileSelect(newFile.id);
        return true;
      }
    } catch (error) {
      console.error("创建文件失败:", error);
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
        fetchFolders();
        return true;
      }
    } catch (error) {
      console.error("创建文件夹失败:", error);
    }
    return false;
  };

  const handleStartDrag = (item: FolderType | MarkdownFileType) => {
    if (item.type === 'file') {
      setDraggedItem(item);
    }
  };

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
        await Promise.all([fetchFiles(), fetchFolders()]);
        setDraggedItem(null);
      }
    } catch (error) {
      console.error("移动文件失败:", error);
    }
  };

  const handleDelete = (item: FolderType | MarkdownFileType) => {
    console.log(item)
    if (item.type === 'file') {
      setCurrentOperation({ type: 'file', action: 'delete', item });
    } else {
      setCurrentOperation({ type: 'folder', action: 'delete', item });
    }
    setError("");
  };

  const renderFileTreeItem = (item: FolderType | MarkdownFileType, level = 0) => {
    if (item.type === 'folder') {
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
              setCurrentOperation({ type: 'folder', action: 'rename', item });
            }}
            onDelete={() => handleDelete(item)}
            level={level}
          />
          {item.files.map(file => renderFileTreeItem(file, level + 1))}
        </div>
      );
    }

    if (item.folderId === null) {
      return (
        <FileTreeItem
          key={item.id}
          item={item}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          onStartDrag={handleStartDrag}
          onDrop={handleDrop}
          onRename={() => {
            setError("");
            setCurrentOperation({ type: 'file', action: 'rename', item });
          }}
          onDelete={() => handleDelete(item)}
          level={level}
        />
      );
    }

    return null;
  };

  return (
    <>
      <div className={twMerge("p-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">文件</h2>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              onClick={() => {
                setError("");
                setIsNewFolderDialogOpen(true);
              }}
            >
              <FolderPlus size={16} className="mr-1" />
              新建文件夹
            </button>
            <button
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              onClick={() => {
                setError("");
                setIsNewFileDialogOpen(true);
              }}
            >
              <FilePlus size={16} className="mr-1" />
              新建文件
            </button>
            <button
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() => fileInputRef.current?.click()}
            >
              上传
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
        <div className="space-y-1">
          {folders.map(folder => renderFileTreeItem(folder))}
          {files
            .filter(file => !file.folderId)
            .map(file => renderFileTreeItem({ ...file, type: 'file' }))}
        </div>
      </div>

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
    </>
  );
};

export default FileList; 