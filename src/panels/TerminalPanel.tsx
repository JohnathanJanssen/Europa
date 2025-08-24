import React, { useEffect, useRef, useState } from "react";

/** Simple read-only sandbox terminal that runs inside the Body area.
 *  Commands: help, ls [path], cd <path>, pwd, cat <file>, grep <pattern> <file>, echo [...], date, whoami, clear
 *  Reads project files via Vite import.meta.glob({ as: "raw" }) and never writes to disk.
 */
type Entry = { id: number; kind: "in" | "out" | "sys" | "err"; text: string };

function useReadonlyFS() {
  const fs = useRef<Record<string, string>>({});
  const list = useRef<string[]>([]);
  useEffect(() => {
    const raw = import.meta.glob("/**/*", { as: "raw", eager: true }) as Record<string,string>;
    const files: Record<string,string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v !== "string") continue;
      if (k.startsWith("/src/") || k.startsWith("/public/") || k === "/package.json") files[k] = v;
    }
    fs.current = files;
    list.current = Object.keys(files).sort();
  }, []);
  return { fs, list };
}

const normalize = (p: string) => p.replace(/\/+/g, "/");
const join = (base: string, p: string) => normalize(p.startsWith("/") ? p : `${base.replace(/\/$/, "")}/${p}` || "/");

export default function TerminalPanel() {
  const { fs, list } = useReadonlyFS();
  const [cwd, setCwd] = useState<string>("/");
  const [line, setLine] = useState<string>("");
  const [log, setLog] = useState<Entry[]>([
    { id: 1, kind: "sys", text: "Jupiter terminal. Type `help`." },
  ]);
  const next = useRef(2);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    viewRef.current?.scrollTo({ top: viewRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  const print = (text: string, kind: Entry["kind"] = "out") =>
    setLog((L) => [...L, { id: next.current++, kind, text }]);

  const prompt = (cmd: string) =>
    setLog((L) => [...L, { id: next.current++, kind: "in", text: `$ ${cmd}` }]);

  const resolve = (p: string) => {
    let r = p.startsWith("/") ? p : join(cwd, p);
    r = normalize(r).replace(/\/\.\//g, "/");
    while (r.includes("/../")) r = r.replace(/\/[^/]+\/\.\.\//, "/");
    return r === "" ? "/" : r;
  };

  const isDir = (p: string) => {
    const pref = p.endsWith("/") ? p : `${p}/`;
    return list.current.some((f) => f.startsWith(pref));
  };
  const exists = (p: string) => fs.current[p] != null || isDir(p);

  const run = (input: string) => {
    const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const cmd = (parts[0] || "").toLowerCase();
    const args = parts.slice(1).map((s) => s.replace(/^"(.*)"$/, "$1"));

    switch (cmd) {
      case "":
        return;
      case "help":
        return print("Built-ins: help, ls [path], cd <path>, pwd, cat <file>, grep <pattern> <file>, echo [...], date, whoami, clear");
      case "pwd":
        return print(cwd);
      case "date":
        return print(new Date().toString());
      case "whoami":
        return print("jupiter");
      case "echo":
        return print(args.join(" "));
      case "clear":
        return setLog([{ id: next.current++, kind: "sys", text: "Jupiter terminal cleared." }]);
      case "cd": {
        const target = resolve(args[0] || "/");
        if (isDir(target)) setCwd(target);
        else print(`cd: no such directory: ${args[0] ?? ""}`, "err");
        return;
      }
      case "ls": {
        const base = resolve(args[0] || cwd);
        if (!exists(base)) return print(`ls: ${base}: not found`, "err");
        const pref = base.endsWith("/") ? base : `${base}/`;
        const names = new Set<string>();
        for (const k of list.current) {
          if (k.startsWith(pref)) {
            const rest = k.slice(pref.length);
            const top = rest.split("/")[0];
            if (top) names.add(top);
          }
        }
        if (fs.current[base]) names.add(base.split("/").pop()!);
        return print(Array.from(names).sort().join("  "));
      }
      case "cat": {
        const p = resolve(args[0] || "");
        const content = fs.current[p];
        return content == null ? print(`cat: ${args[0] ?? ""}: not found`, "err") : print(content);
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
        return;
      }
      default:
        return print(`${cmd}: command not found`, "err");
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = line.trim();
    if (!cmd) return;
    prompt(cmd);
    run(cmd);
    setLine("");
  };

  return (
    <div className="panel terminal" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        ref={viewRef}
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
        {log.map((en) => (
          <div
            key={en.id}
            style={{
              whiteSpace: "pre-wrap",
              color:
                en.kind === "err" ? "#f88" : en.kind === "sys" ? "#9ccfff" : "var(--text-2, #cbd5e1)",
            }}
          >
            {en.text}
          </div>
        ))}
      </div>

      {/* Local input confined to the panel (does NOT affect header/footer) */}
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={line}
          onChange={(e) => setLine(e.target.value)}
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
            background: "linear-gradient(135deg, rgba(124,58,237,.95), rgba(59,130,246,.95))",
            color: "#fff",
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