import React from "react";
import { useJupiterTerminal } from "@/hooks/use-jupiter-terminal";
import { Textarea } from "@/components/ui/textarea";

export function TerminalPanel() {
  const { output } = useJupiterTerminal();

  return (
    <div className="p-4 h-full flex flex-col gap-4">
      <Textarea
        className="w-full flex-1 bg-black text-green-400 font-mono text-xs"
        value={output}
        readOnly
        placeholder="Terminal output..."
      />
    </div>
  );
}