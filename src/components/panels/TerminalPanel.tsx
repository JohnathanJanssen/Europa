import React, { useState } from "react";
import { useJupiterTerminal } from "@/hooks/use-jupiter-terminal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function TerminalPanel() {
  const { output, runCommand } = useJupiterTerminal();
  const [cmd, setCmd] = useState("");

  const handleRunCommand = () => {
    if (!cmd.trim()) return;
    runCommand(cmd);
    setCmd("");
  };

  return (
    <div className="p-4 h-full flex flex-col gap-4">
      <div className="flex gap-2">
        <Input
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          placeholder="Enter command"
          className="bg-gray-900 text-white font-mono"
          onKeyDown={e => {
            if (e.key === "Enter") handleRunCommand();
          }}
        />
        <Button onClick={handleRunCommand}>Run</Button>
      </div>
      <Textarea
        className="w-full flex-1 bg-black text-green-400 font-mono text-xs"
        value={output}
        readOnly
        placeholder="Terminal output..."
      />
    </div>
  );
}