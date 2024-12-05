"use client";

import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import './custom-toast.css'
import dynamic from "next/dynamic";
import { Editor } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import * as monaco from "monaco-editor"; // 确保正确导入 monaco
import { throttle } from "lodash";
import Dialog from "@/components/Dialog";

const FileList = dynamic(() => import("@/components/FileList"), { ssr: false });
const MilestoneList = dynamic(() => import("@/components/MilestoneList"), { ssr: false });

interface MilestoneDetails  {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

const HomePage = () => {
  const [markdown, setMarkdown] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [previewMilestone, setPreviewMilestone] = useState<MilestoneDetails | null>(null);
  const [replaceDialog, setReplaceDialog] = useState(false);

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
      setPreviewMilestone(null); // 关闭任何预览

      toast.success("文件加载成功");
    } catch (error) {
      console.error("文件加载失败:", error);
      toast.error("文件加载失败");
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
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

  const handleSelectMilestone = (milestone: MilestoneDetails) => {
    setPreviewMilestone(milestone);
    setEditorMounted(false);
    toast.info(`正在预览里程碑 "${milestone.name}"`);
  };

  const handleReplaceWithMilestone = () => {
    if (previewMilestone && selectedFile) {
      setMarkdown(previewMilestone.content);
      saveFile(previewMilestone.content);
      setReplaceDialog(false);
      setPreviewMilestone(null);
      toast.success(`已替换为里程碑 "${previewMilestone.name}"`);
    }
  };

  const handleRestoreCurrent = () => {
    setPreviewMilestone(null);
  };


  const handleEditorDidMount = (
      editor: monaco.editor.IStandaloneCodeEditor
  ) => {
    console.log("Editor mounted");
    editorRef.current = editor;
    setEditorMounted(true);
  };

  useEffect(() => {
    console.log(editorMounted)
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
      const editorContentHeight = editor.getContentHeight();
      const editorLayoutHeight = editor.getLayoutInfo().height;
      const editorScrollableHeight = Math.max(editorContentHeight - editorLayoutHeight, 0);
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
        <div className="flex flex-col w-80 border-r border-zinc-200 bg-white min-h-0">
          <FileList
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              className="flex-1 border-b border-zinc-200 overflow-y-auto"
          />
          {selectedFile && (
              <MilestoneList
                  fileId={selectedFile}
                  currentMarkdown={markdown}
                  onSelectMilestone={handleSelectMilestone}
                  className="flex-1 overflow-y-auto"
              />
          )}
        </div>
          <div className="flex flex-1 overflow-hidden relative">
            {previewMilestone ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-zinc-200">

                    <h2 className="text-lg font-semibold">预览里程碑: {previewMilestone.name}</h2>
                    <div className="space-x-2">
                      <button
                          onClick={() => {
                            setReplaceDialog(true)
                          }}
                          className="bg-green-500 text-white px-3 py-2"
                      >
                        替换
                      </button>
                      <button
                          onClick={handleRestoreCurrent}
                          className="bg-gray-500 text-white px-3 py-2"
                      >
                        取消预览
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-4 bg-white">
                    <article className="prose prose-slate max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]}
                                     rehypePlugins={[[rehypeKatex, {strict: false}]]}
                      >
                        {previewMilestone.content}
                      </ReactMarkdown>
                      <div style={{height: '100vh'}}></div>
                    </article>
                  </div>
                </div>
            ) : (
                <>
                  <div className="w-1/2 border-r border-zinc-200 relative">
                    <Editor
                        height="100vh"
                        defaultLanguage="markdown"
                        value={markdown}
                        onChange={handleEditorChange}
                        onMount={handleEditorDidMount}
                        theme="vs-light"
                        options={{
                          minimap: {enabled: false},
                          fontSize: 14,
                          wordWrap: "on",
                        }}
                    />
                  </div>
                  <div ref={previewRef} className="w-1/2 overflow-auto p-4 bg-white">
                    <article className="prose prose-slate max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]}
                                     rehypePlugins={[[rehypeKatex, {strict: false}]]}
                      >
                        {markdown}
                      </ReactMarkdown>
                      <div style={{height: '100vh'}}></div>
                    </article>
                  </div>
                </>
            )}
          </div>
          <ToastContainer
              autoClose={1000}
              theme="colored"
          />

          <Dialog
              isOpen={replaceDialog}
              onClose={() => {
                setReplaceDialog(false)
              }}
              onConfirm={handleReplaceWithMilestone}
              title={`替换里程碑`}
              description={`确定要将当前工作区内容，替换为里程碑${previewMilestone?.name}的内容吗？此操作不可撤销`}
              type="confirm"
              confirmText="确定"
              confirmButtonClass="bg-red-500 hover:bg-red-600"
          />
        </div>
        );
        };

        export default HomePage;
