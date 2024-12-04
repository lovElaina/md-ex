"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Editor } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import * as monaco from "monaco-editor"; // 确保正确导入 monaco
import { throttle } from "lodash";

const FileList = dynamic(() => import("@/components/FileList"), { ssr: false });

const HomePage = () => {
  const [markdown, setMarkdown] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>("");

  const [editorMounted, setEditorMounted] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const isSyncingScroll = useRef(false);

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

  const handleEditorDidMount = (
      editor: monaco.editor.IStandaloneCodeEditor,
      monacoInstance: typeof import("monaco-editor")
  ) => {
    console.log("Editor mounted");
    editorRef.current = editor;
    setEditorMounted(true);
  };

  useEffect(() => {
    if (!editorMounted) return;

    const editor = editorRef.current;
    const preview = previewRef.current;

    if (!editor || !preview) return;

    const handleEditorScrollThrottled = throttle(() => {
      if (isSyncingScroll.current) {
        isSyncingScroll.current = false;
        return;
      }
      isSyncingScroll.current = true;

      const editorScrollTop = editor.getScrollTop();
      console.log("editorScrollTop:",editorScrollTop);
      const editorContentHeight = editor.getContentHeight();
      console.log("editorContentHeight:", editorContentHeight);
      const editorLayoutHeight = editor.getLayoutInfo().height;
      console.log("editorLayoutHeight:",editorLayoutHeight);
      const editorScrollableHeight = Math.max(editorContentHeight - editorLayoutHeight, 0);
      console.log("editorScrollableHeight:",editorScrollableHeight);
      let scrollRatio = 0;

      if (editorScrollableHeight > 0) {
        scrollRatio = editorScrollTop / editorScrollableHeight;
        scrollRatio = Math.min(scrollRatio, 1); // 确保比例不超过1
      } else {
        scrollRatio = 1; // 无可滚动区域，视为已滚动到底部
      }

      if (scrollRatio >= 1) {
        // 当编辑器滚动到最底部或无可滚动区域时，预览滚动到最底部
        preview.scrollTop = preview.scrollHeight - preview.clientHeight;
      } else {
        // 根据比例同步预览区域的滚动位置
        const previewScrollHeight = preview.scrollHeight - preview.clientHeight;
        preview.scrollTop = scrollRatio * previewScrollHeight;
      }

      // 重置同步标志
      isSyncingScroll.current = false;
    }, 50);

    const handlePreviewScrollThrottled = throttle(() => {
      if (isSyncingScroll.current) {
        isSyncingScroll.current = false;
        return;
      }
      isSyncingScroll.current = true;

      const previewScrollTop = preview.scrollTop;
      const previewScrollHeight = preview.scrollHeight - preview.clientHeight;

      let scrollRatio = 0;

      if (previewScrollHeight > 0) {
        scrollRatio = previewScrollTop / previewScrollHeight;
        scrollRatio = Math.min(scrollRatio, 1); // 确保比例不超过1
      } else {
        scrollRatio = 1; // 无可滚动区域，视为已滚动到底部
      }

      if (scrollRatio >= 1) {
        // 当预览滚动到最底部或无可滚动区域时，编辑器滚动到最底部
        const editorContentHeight = editor.getContentHeight();
        const editorLayoutHeight = editor.getLayoutInfo().height;
        const editorScrollableHeight = Math.max(editorContentHeight - editorLayoutHeight, 0);
        editor.setScrollTop(editorScrollableHeight);
      } else {
        // 根据比例同步编辑器的滚动位置
        const editorContentHeight = editor.getContentHeight();
        const editorLayoutHeight = editor.getLayoutInfo().height;
        const editorScrollableHeight = Math.max(editorContentHeight - editorLayoutHeight, 0);
        const editorScrollTop = scrollRatio * editorScrollableHeight;
        editor.setScrollTop(editorScrollTop);
      }

      // 重置同步标志
      isSyncingScroll.current = false;
    }, 50);

    // 绑定滚动事件
    const disposable = editor.onDidScrollChange(handleEditorScrollThrottled);
    preview.addEventListener("scroll", handlePreviewScrollThrottled);

    // 清理事件监听器
    return () => {
      disposable.dispose();
      preview.removeEventListener("scroll", handlePreviewScrollThrottled);
      handleEditorScrollThrottled.cancel();
      handlePreviewScrollThrottled.cancel();
    };
  }, [editorMounted]);

  return (
      <div className="flex h-screen">
        <FileList
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            className="w-80 border-r border-zinc-200 bg-white"
        />
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 border-r border-zinc-200">
            <Editor
                height="100vh"
                defaultLanguage="markdown"
                value={markdown}
                language="markdown"
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                }}
            />
          </div>
          <div ref={previewRef} className="w-1/2 overflow-auto p-4 bg-white">
            <article className="prose prose-slate max-w-none">
              <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
              >
                {markdown}
              </ReactMarkdown>
              <div style={{height: '100vh'}}></div>
            </article>
          </div>
        </div>
      </div>
  );
};

export default HomePage;
