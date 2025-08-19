import { useState } from "react";

const API = "http://localhost:3456";

export function useJupiterFiles() {
  const [files, setFiles] = useState<{ name: string; isDir: boolean }[]>([]);
  const [content, setContent] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string>("");

  const listFiles = async (dir = "") => {
    const res = await fetch(`${API}/files?dir=${encodeURIComponent(dir)}`);
    const data = await res.json();
    setFiles(data);
    setCurrentPath(dir);
  };

  const readFile = async (path: string) => {
    const res = await fetch(`${API}/file?path=${encodeURIComponent(path)}`);
    const data = await res.json();
    setContent(data.content);
    setCurrentPath(path);
  };

  const writeFile = async (path: string, content: string) => {
    await fetch(`${API}/file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content }),
    });
    setContent(content);
  };

  const deleteFile = async (path: string) => {
    await fetch(`${API}/file?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
    });
    setContent("");
  };

  return {
    files,
    content,
    currentPath,
    listFiles,
    readFile,
    writeFile,
    deleteFile,
    setContent,
    setCurrentPath,
  };
}