import React, { useEffect, useState } from 'react';
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGlowLevel } from "@/components/Waveform";
import { toast } from "sonner";
import { chat, type Msg } from '../runtime/brain.ts';
import { matchAction, performAction } from '../runtime/actions.ts';
import ThoughtsBubble from './ThoughtsBubble';

const CHAT_HISTORY_KEY = "jupiter_chat_history";

export const JupiterChat: React.FC = () => {
  const [input, setInput] = useState("");
  const [isDropping, setIsDropping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const glowLevel = useGlowLevel(isLoading);

  const [chatHistory, setChatHistory] = useState<(Msg & { id: string, imageUrl?: string })[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    (window as any).JUP_goVision   = () => document.dispatchEvent(new CustomEvent("JUP:face", { detail: "vision" }));
    (window as any).JUP_goTerminal = () => document.dispatchEvent(new CustomEvent("JUP:face", { detail: "terminal" }));
    (window as any).JUP_goSettings = () => document.dispatchEvent(new CustomEvent("JUP:face", { detail: "settings" }));
    return () => {
      (window as any).JUP_goVision = (window as any).JUP_goTerminal = (window as any).JUP_goSettings = undefined;
    };
  }, []);

  async function sendUserMessage(text: string, imageUrl?: string) {
    const userMessage: (Msg & { id: string, imageUrl?: string }) = {
      role: 'user', content: text, id: Date.now().toString(), imageUrl,
    };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setIsLoading(true);
    try {
      const historyForApi = newHistory.map(({ role, content }) => ({ role, content }));
      const reply = await chat(historyForApi);
      const assistantMessage: (Msg & { id: string }) = { role: 'assistant', content: reply, id: (Date.now() + 1).toString() };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error(e);
      toast.error("I was unable to get a reply. Please check your API keys.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(text: string) {
    const raw = (text || '').trim();
    if (!raw) return;
    setInput("");

    const t = raw.toLowerCase();
    if (/^open (vision|camera)\b/.test(t)) { (window as any).JUP_goVision?.(); return; }
    if (/^open settings\b/.test(t))       { (window as any).JUP_goSettings?.(); return; }
    if (/^open terminal\b/.test(t))       { (window as any).JUP_goTerminal?.(); return; }

    const action = matchAction(raw);
    if (action) {
      await performAction(action);
      return;
    }

    await sendUserMessage(raw);
  }

  const handleClearChat = () => {
    setChatHistory([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    toast.success("Chat history cleared.");
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDropping(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDropping(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const message = `I have uploaded the file named "${file.name}". Its content is:\n\n---\n${content}\n---`;
        handleSubmit(message);
        toast.success(`File "${file.name}" loaded for analysis.`);
      };
      reader.readAsText(file);
    }
  };

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto space-y-3 bg-transparent max-h-[460px] py-2">
      {chatHistory.map((msg: any) => (
        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`rounded-2xl px-4 py-2 max-w-[80%] shadow ${msg.role === "user" ? "bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-700 text-white font-semibold" : "bg-gradient-to-r from-gray-800 via-gray-900 to-black text-blue-100"}`}>
            {msg.imageUrl && <img src={msg.imageUrl} alt="User content" className="rounded-lg mb-2 max-w-full h-auto" />}
            <div className="break-words">{msg.content || msg.text}</div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="rounded-2xl px-4 py-2 bg-gradient-to-r from-gray-800 via-gray-900 to-black text-blue-100 max-w-[80%] shadow">
            <div className="flex items-center justify-center space-x-1.5 h-5">
              <span className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse [animation-delay:0s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse [animation-delay:0.4s]"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInputRow = (onSubmit: (text: string) => void) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex flex-col">
        <div className="relative flex items-center">
          <Input
            className="bg-[#18182a] text-white rounded-full border border-[#2d2d4d] px-4 py-2 focus:ring-2 focus:ring-blue-600 w-full"
            placeholder={isDropping ? "Drop file to analyze" : "Type or drop a file…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onSubmit(input); }}
            disabled={isLoading}
            style={{ fontSize: 16, background: "rgba(24,24,42,0.92)", boxShadow: "0 1.5px 8px 0 #6366f122" }}
          />
        </div>
      </div>
      <Button onClick={() => handleSubmit(input)} disabled={isLoading || !input.trim()} size="icon" aria-label="Send" className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow">
        <Send />
      </Button>
    </div>
  );

  return (
    <div className="relative flex w-full items-center justify-center">
      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-3 px-2 select-none">
          <div className="w-6" />
          <div className="text-white/95 font-semibold tracking-[0.22em] text-[13px] md:text-[14px]">JUPITER</div>
          <div className="flex-1">
            <ThoughtsBubble variant="inline" />
          </div>
          <div className="flex items-center gap-2">
            <button title="Vision" onClick={() => (window as any).JUP_goVision?.()} className="rounded-xl border border-white/10 bg-white/5 p-1 hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            <button title="Terminal" onClick={() => (window as any).JUP_goTerminal?.()} className="rounded-xl border border-white/10 bg-white/5 p-1 hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.5"/><path d="m7 9 3 3-3 3" stroke="currentColor" strokeWidth="1.5"/><path d="M12 15h5" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            <button title="Settings" onClick={() => (window as any).JUP_goSettings?.()} className="rounded-xl border border-white/10 bg-white/5 p-1 hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.5"/><path d="M19.4 15.5a7.9 7.9 0 0 0 .1-7l1.7-1.7-2.3-2.3L17.2 4a7.9 7.9 0 0 0-7 0L8.1 2.5 5.8 4.8 7.5 6.5a7.9 7.9 0 0 0 0 7L5.8 15.2l2.3 2.3 1.7-1.7a7.9 7.9 0 0 0 7 0l1.7 1.7 2.3-2.3-1.7-1.7Z" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 p-2 w-[400px] md:w-[460px] relative" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className="mt-2">{renderMessages()}</div>
          <div className="mt-2">{renderInputRow(handleSubmit)}</div>
        </div>
      </div>
    </div>
  );
};