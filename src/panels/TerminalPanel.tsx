import React, { useEffect, useRef, useState } from "react";

/** Terminal entry line */
type Entry = { id: number; type: "in" | "out" | "sys" | "err"; text: string };

export default function TerminalPanel() {
  // virtual FS (built once from project files)
  const fs = useRef<Record<string, string>>({});
  const paths = useRef<string[]>([]); // sorted list of file paths

  // shell state
  const [cwd, setCwd] = useState<string>("/");
  const [cmd, setCmd] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([
    { id: 1, type: "sys", text: "Jupiter terminal. Type `help`." },
  ]);
  const nextId = useRef(2);
  const outRef = useRef<HTMLDivElement>(null);

  // Build a read-only view of the app files at runtime
  useEffect(() => {
    // Grab raw source for /src and /public (and package.json)
    const raw = import.meta.glob("/**/*", { as: "raw", eager: true }) as Record<
      string,
      string
    >;

    const files: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v !== "string") continue;
      if (k.startsWith("/src/") || k.startsWith("/public/") || k === "/package.json") {
        files[k] = v;
      }
    }
    fs.current = files;
    paths.current = Object.keys(files).sort();
  }, []);

  // autoscroll
  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight, behavior: "smooth" });
  }, [entries]);

  // helpers
  const print = (text: string, type: Entry["type"] = "out") =>
    setEntries((e) => [...e, { id: nextId.current++, type, text }]);

  const prompt = (c: string) =>
    setEntries((e) => [...e, { id: nextId.current++, type: "in", text: `$ ${c}` }]);

  const normalize = (p: string) => p.replace(/\/+/g, "/");

  const join = (base: string, p: string) =>
    normalize((p.startsWith("/") ? p : `${base.replace(/\/$/, "")}/${p}`) || "/");

  const resolve = (p: string) => {
    let r = p.startsWith("/") ? p : join(cwd, p);
    // resolve .. and .
    r = normalize(r);
    while (r.includes("/../")) r = r.replace(/\/[^/]+\/\.\.\//, "/");
    r = r.replace(/\/\.\//g, "/").replace(/\/$/, "");
    return r || "/";
  };

  const isDir = (p: string) => {
    const pref = p.endsWith("/") ? p : `${p}/`;
    return paths.current.some((k) => k.startsWith(pref));
  };

  const exists = (p: string) => fs.current[p] != null || isDir(p);

  // commands
  const run = (line: string) => {
    const parts = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const cmd = (parts[0] || "").toLowerCase();
    const args = parts.slice(1).map((s) => s.replace(/^"(.*)"$/, "$1"));

    switch (cmd) {
      case "":
        break;

      case "help":
        print(
          "Built-ins: help, ls [path], cd <path>, pwd, cat <file>, grep <pattern> <file>, echo [...], date, whoami, clear"
        );
        break;

      case "pwd":
        print(cwd);
        break;

      case "date":
        print(new Date().toString());
        break;

      case "whoami":
        print("jupiter");
        break;

      case "echo":
        print(args.join(" "));
        break;

      case "clear":
        setEntries([{ id: nextId.current++, type: "sys", text: "Jupiter terminal cleared." }]);
        break;

      case "cd": {
        const target = resolve(args[0] || "/");
        if (isDir(target)) setCwd(target);
        else print(`cd: no such directory: ${args[0] ?? ""}`, "err");
        break;
      }

      case "ls": {
        const base = resolve(args[0] || cwd);
        if (!exists(base)) return print(`ls: ${base}: not found`, "err");

        const pref = base.endsWith("/") ? base : `${base}/`;
        const names = new Set<string>();

        // list top-level children
        for (const k of paths.current) {
          if (k.startsWith(pref)) {
            const rest = k.slice(pref.length);
            const top = rest.split("/")[0];
            if (top) names.add(top);
          }
        }
        // if base itself is a file, show it too
        if (fs.current[base]) names.add(base.split("/").pop()!);

        print(Array.from(names).sort().join("  "));
        break;
      }

      case "cat": {
        const p = resolve(args[0] || "");
        const content = fs.current[p];
        if (content == null) print(`cat: ${args[0] ?? ""}: not found`, "err");
        else print(content);
        break;
      }

      case "grep": {
        const [pattern, file] = args;
        if (!pattern || !file) return print("usage: grep <pattern> <file>", "err");

        const p = resolve(file);
        const content = fs.current[p];
        if (content == null) return print(`grep: ${file}: not found`, "err");

        try {
          const re = new RegExp(pattern, "i");
          const lines = content
            .split("\n")
            .map((ln, i) => (re.test(ln) ? `${String(i + 1).padStart(3, " ")} ${ln}` : null))
            .filter(Boolean)
            .join("\n");
          print(lines || "(no matches)");
        } catch {
          print("grep: invalid pattern", "err");
        }
        break;
      }

      default:
        print(`${cmd}: command not found`, "err");
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const line = cmd.trim();
    if (!line) return;
    prompt(line);
    run(line);
    setCmd("");
  };

  return (
    <div className="panel terminal" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        ref={outRef}
        className="terminal-out"
        style={{
          height: 340,
          overflow: "auto",
          borderRadius: 12,
          padding: 12,
          background: "rgba(0,0,0,0.35)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        {entries.map((en) => (
          <div
            key={en.id}
            style={{
              whiteSpace: "pre-wrap",
              color:
                en.type === "err" ? "#f88" : en.type === "sys" ? "#9ccfff" : "var(--text-2, #cbd5e1)",
            }}
          >
            {en.text}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="Type a command..."
          aria-label="Terminal command"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.06)",
            color: "var(--text-1, #e5e7eb)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          aria-label="Run"
          style={{
            borderRadius: 12,
            padding: "8px 12px",
            background:
              "linear-gradient(135deg, rgba(124,58,237,.95), rgba(59,130,246,.95))",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          ›
        </button>
      </form>
    </div>
  );
}