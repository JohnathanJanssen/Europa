import React from "react";

type Props = {
  className?: string;
  onClose?: () => void;
  lines: string[];        // render-only buffer
  /* Footer handles input now */
};

export default function TerminalPanel({ className, onClose, lines }: Props){
  return (
    <div className={className ?? ""} role="region" aria-label="Terminal">
      <div className="panel-head">
        <div className="title">Terminal</div>
        <button className="x" onClick={onClose} aria-label="Close">Close</button>
      </div>
      <div className="term-body">
        <pre className="term-screen" aria-live="polite">
{lines.join("\n")}
        </pre>
      </div>
      {/* No local input. Footer input routes commands into the terminal. */}
    </div>
  );
}