import React, { useEffect, useState } from "react";
import { useJupiterFiles } from "@/hooks/use-jupiter-files";
import { useJupiterTerminal } from "@/hooks/use-jupiter-terminal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Tools() {
  const {
    files,
    content,
    currentPath,
    listFiles,
    readFile,
    writeFile,
    deleteFile,
    createDirectory,
    renameFile,
    setContent,
    setCurrentPath,
  } = useJupiterFiles();
  const { output, runCommand } = useJupiterTerminal();
  const [dir, setDir] = useState("");
  const [cmd, setCmd] = useState("");
  const [newDirName, setNewDirName] = useState("");

  useEffect(() => {
    listFiles(dir);
    // eslint-disable-next-line
  }, [dir]);

  const handleRename = async (oldName: string) => {
    const newName = prompt(`Enter new name for "${oldName}":`, oldName);
    if (newName && newName.trim() && newName !== oldName) {
      const oldPath = dir ? `${dir}/${oldName}` : oldName;
      const newPath = dir ? `${dir}/${newName}` : newName;
      await renameFile(oldPath, newPath);
      toast.success(`Renamed to "${newName}"`);
      listFiles(dir);
    }
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      const path = dir ? `${dir}/${name}` : name;
      await deleteFile(path);
      toast.success(`"${name}" has been deleted.`);
      listFiles(dir);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* File browser */}
      <div className="w-full md:w-1/2 p-4">
        <h2 className="text-xl font-bold text-white mb-2">File Browser</h2>
        <div className="flex gap-2 mb-2">
          <Input
            value={dir}
            onChange={e => setDir(e.target.value)}
            placeholder="Directory (relative to backend root)"
            className="bg-gray-900 text-white"
          />
          <Button onClick={() => listFiles(dir)}>List</Button>
        </div>
        <div className="flex gap-2 mb-2">
          <Input
            value={newDirName}
            onChange={e => setNewDirName(e.target.value)}
            placeholder="New directory name"
            className="bg-gray-900 text-white"
            onKeyDown={async (e) => {
              if (e.key === "Enter" && newDirName.trim()) {
                const path = dir ? `${dir}/${newDirName}` : newDirName;
                await createDirectory(path);
                toast.success(`Directory "${newDirName}" created`);
                setNewDirName("");
                listFiles(dir);
              }
            }}
          />
          <Button onClick={async () => {
            if (!newDirName.trim()) return toast.error("Directory name cannot be empty.");
            const path = dir ? `${dir}/${newDirName}` : newDirName;
            await createDirectory(path);
            toast.success(`Directory "${newDirName}" created`);
            setNewDirName("");
            listFiles(dir);
          }}>Create Folder</Button>
        </div>
        <ul className="bg-black/40 rounded p-2 max-h-64 overflow-auto">
          {files.map(f => (
            <li key={f.name} className="flex items-center justify-between gap-2 p-1 rounded hover:bg-white/10">
              <div className="flex items-center gap-2 overflow-hidden">
                {f.isDir ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDir(dir ? `${dir}/${f.name}` : f.name)}
                    className="text-blue-400 text-left justify-start w-full"
                  >
                    <span className="mr-2">📁</span>
                    <span className="truncate">{f.name}</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => readFile(dir ? `${dir}/${f.name}` : f.name)}
                    className="text-green-400 text-left justify-start w-full"
                  >
                    <span className="mr-2">📄</span>
                    <span className="truncate">{f.name}</span>
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleRename(f.name)}>Rename</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(f.name)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
        {currentPath && !files.some(f => f.isDir && (dir ? `${dir}/${f.name}` : f.name) === currentPath) && (
          <div className="mt-4">
            <h3 className="text-white font-semibold mb-1">Editing: {currentPath}</h3>
            <Textarea
              className="w-full h-40 bg-gray-900 text-white font-mono"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <Button
              className="mt-2"
              onClick={async () => {
                await writeFile(currentPath, content);
                toast.success("File saved");
              }}
            >
              Save
            </Button>
          </div>
        )}
      </div>
      {/* Terminal */}
      <div className="w-full md:w-1/2 p-4 border-l border-gray-800">
        <h2 className="text-xl font-bold text-white mb-2">Terminal</h2>
        <div className="flex gap-2 mb-2">
          <Input
            value={cmd}
            onChange={e => setCmd(e.target.value)}
            placeholder="Enter command"
            className="bg-gray-900 text-white"
            onKeyDown={e => {
              if (e.key === "Enter") runCommand(cmd);
            }}
          />
          <Button onClick={() => runCommand(cmd)}>Run</Button>
        </div>
        <Textarea
          className="w-full h-64 bg-black text-green-400 font-mono"
          value={output}
          readOnly
        />
      </div>
    </div>
  );
}