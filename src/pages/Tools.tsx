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
    setContent,
    setCurrentPath,
  } = useJupiterFiles();
  const { output, runCommand } = useJupiterTerminal();
  const [dir, setDir] = useState("");
  const [cmd, setCmd] = useState("");

  useEffect(() => {
    listFiles(dir);
    // eslint-disable-next-line
  }, [dir]);

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
        <ul className="bg-black/40 rounded p-2 max-h-64 overflow-auto">
          {files.map(f => (
            <li key={f.name} className="flex items-center gap-2">
              {f.isDir ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDir(dir ? `${dir}/${f.name}` : f.name)}
                  className="text-blue-400"
                >
                  📁 {f.name}
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => readFile(dir ? `${dir}/${f.name}` : f.name)}
                    className="text-green-400"
                  >
                    📄 {f.name}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      await deleteFile(dir ? `${dir}/${f.name}` : f.name);
                      toast.success("File deleted");
                      listFiles(dir);
                    }}
                  >
                    Delete
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
        {currentPath && !currentPath.endsWith("/") && (
          <div className="mt-4">
            <h3 className="text-white font-semibold mb-1">Editing: {currentPath}</h3>
            <Textarea
              className="w-full h-40 bg-gray-900 text-white"
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