import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Folder, ChevronRight, ChevronDown, Pencil, Trash2, FileText } from "lucide-react";

type FileTreeItemProps = {
  item: FolderType | MarkdownFileType;
  selectedFile: string | null;
  onFileSelect: (fileId: string) => void;
  onStartDrag: (item: FolderType | MarkdownFileType) => void;
  onDrop: (targetId: string) => void;
  onRename: (item: FolderType | MarkdownFileType) => void;
  onDelete: (item: FolderType | MarkdownFileType) => void;
  level?: number;
};

export type FolderType = {
  id: string;
  title: string;
  files: MarkdownFileType[];
  type: 'folder';
};

export type MarkdownFileType = {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  updatedAt: string;
  type: 'file';
};

const FileTreeItem = ({
  item,
  selectedFile,
  onFileSelect,
  onStartDrag,
  onDrop,
  onRename,
  onDelete,
  level = 0,
}: FileTreeItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onStartDrag(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.type === 'folder') {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (item.type === 'folder') {
      onDrop(item.id);
    }
  };

  return (
    <div style={{ paddingLeft: `${level * 16}px` }}>
      <div
        className={twMerge(
          "group relative flex items-center py-1 px-2 rounded-md",
          isDragOver && "bg-blue-50",
          item.type === 'file' && selectedFile === item.id && "bg-zinc-100"
        )}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center flex-1">
          {item.type === 'folder' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-zinc-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          )}
          <div className="flex items-center gap-2">
            {item.type === 'folder' ? (
              <Folder size={16} className="text-blue-500" />
            ) : (
              <FileText size={16} className="text-zinc-400" />
            )}
            <span
              className="flex-1 cursor-pointer"
              onClick={() => item.type === 'file' && onFileSelect(item.id)}
            >
              {item.title}
            </span>
          </div>
        </div>

        <div
          className={twMerge(
            "absolute right-2 flex gap-1 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <button
            onClick={() => onRename(item)}
            className="p-1 text-zinc-600 hover:text-blue-500 rounded"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1 text-zinc-600 hover:text-red-500 rounded"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {item.type === 'folder' && isExpanded && (
        <div className="mt-1">
          {item.files.map((file) => (
            <FileTreeItem
              key={file.id}
              item={file}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              onStartDrag={onStartDrag}
              onDrop={onDrop}
              onRename={onRename}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTreeItem; 