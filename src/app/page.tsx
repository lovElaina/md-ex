"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Editor } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css"

const FileList = dynamic(() => import("@/components/FileList"), { ssr: false });

const HomePage = () => {
  const [markdown, setMarkdown] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>("");

  useEffect(() => {
    if (selectedFile) {
      loadFile(selectedFile);
    }
  }, [selectedFile]);

  const loadFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`);
      const data = await response.json();
      setMarkdown(data.content);
      setCurrentTitle(data.title);
    } catch (error) {
      console.error("加载文件失败:", error);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setMarkdown(value);
      if (selectedFile) {
        saveFile(value);
      }
    }
  };

  const saveFile = async (content: string) => {
    if (!selectedFile) return;

    try {
      await fetch(`/api/files/${selectedFile}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: currentTitle,
          content,
        }),
      });
    } catch (error) {
      console.error("保存文件失败:", error);
    }
  };

  return (
    <div className="flex h-screen">
      <FileList
        selectedFile={selectedFile}
        onFileSelect={setSelectedFile}
        className="w-64 border-r border-zinc-200 bg-white"
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-zinc-200">
          <Editor
            height="100vh"
            defaultLanguage="markdown"
            value={markdown}
            language="markdown"
            onChange={handleEditorChange}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
            }}
          />
        </div>
        <div className="w-1/2 overflow-auto p-4 bg-white">
          <article className="prose prose-slate max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {markdown}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
