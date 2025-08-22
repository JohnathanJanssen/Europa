import React, { useEffect, useRef, useState } from 'react';
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGlowLevel } from "@/components/Waveform";
import { toast } from "sonner";
import { chat, type Msg } from '../runtime/brain.ts';
import { matchAction, performAction } from '../runtime/actions.ts';
import HeaderBar from './HeaderBar';
import FlipFrame from './FlipFrame';
import SpotlightCard from './SpotlightCard';
import { uiBus } from '../runtime/uiBus';
import { visionBus } from '../runtime/visionBus';
import { speak } from '../runtime/voice';

const CHAT_HISTORY_KEY = "jupiter_chat_history";

export const JupiterChat: React.FC = () => {
  const [input, setInput] = useState("");
  const [isDropping, setIsDropping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const glowLevel = useGlowLevel(isLoading);

  const [mode, setMode] = useState(uiBus.get());
  useEffect(()=>uiBus.on(setMode),[]);
  const [forceReply, setForceReply] = useState(false);

  const [chatHistory, setChatHistory] = useState<(Msg & { id: string, imageUrl?: string })[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  }, [chatHistory]);

  const addAssistant = (content: string) => {
    setChatHistory(prev => [...prev, { role: 'assistant', content, id: Date.now().toString() }]);
  };

  useEffect(() => visionBus.onAskIdentity.on(() => {
    addAssistant("I don't recognize you yet. What should I call you?");
    try { speak?.("I don't recognize you yet. What should I call you?"); } catch {}
    if (mode!=='vision') uiBus.openVision();
    setForceReply(true);
  }), [mode]);

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
      await speak(reply);
      addAssistant(reply);
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

    if (forceReply) {
      const name = raw.replace(/^i['’]m\s+/i,'').replace(/^my name is\s+/i,'').trim();
      visionBus.enroll(name);
      addAssistant(`Nice to meet you, ${name}. I’ll remember you.`);
      try { speak?.(`Nice to meet you, ${name}. I’ll remember you.`); } catch {}
      setForceReply(false);
      if (mode!=='front') uiBus.back();
      return;
    }

    const t = raw.toLowerCase();
    if (/^open (vision|camera)\b/.test(t)) { uiBus.openVision(); return; }
    if (/^open settings\b/.test(t))       { uiBus.openSettings(); return; }
    if (/^open terminal\b/.test(t))       { uiBus.openTerminal(); return; }
    if (/^close( spotlight)?\b/.test(t))  { uiBus.back(); return; }

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
      // This logic needs to be adapted to the new handleSubmit flow
      // For now, we'll just send the file content as a message
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
            autoFocus={forceReply}
            style={{ fontSize: 16, background: "rgba(24,24,42,0.92)", boxShadow: "0 1.5px 8px 0 #6366f122" }}
          />
        </div>
      </div>
      <Button onClick={() => onSubmit(input)} disabled={isLoading || !input.trim()} size="icon" aria-label="Send" className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow">
        <Send />
      </Button>
    </div>
  );

  const flipped = mode !== 'front';

  return (
    <div className="relative">
      <div className="relative [perspective:1200px] pt-1">
        <div className={`relative ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
          <FlipFrame
            front={
              <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-3" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <HeaderBar />
                <div className="mt-2">{renderMessages()}</div>
                <div className="mt-2">{renderInputRow(handleSubmit)}</div>
              </div>
            }
            back={
              <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-3">
                <HeaderBar />
                <div className="mt-2">
                  <SpotlightCard />
                </div>
                {forceReply && (
                  <div className="mt-2">
                    {renderInputRow(handleSubmit)}
                  </div>
                )}
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};