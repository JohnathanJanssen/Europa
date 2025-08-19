import { useState } from "react";

const API = "http://localhost:3456";

export function useJupiterTerminal() {
  const [output, setOutput] = useState<string>("");

  const runCommand = async (command: string) => {
    setOutput("Running...");
    const res = await fetch(`${API}/terminal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
    const data = await res.json();
    setOutput(
      (data.stdout || "") +
        (data.stderr ? "\n" + data.stderr : "") +
        (data.error ? "\n[ERROR] " + data.error : "")
    );
  };

  return { output, runCommand };
}