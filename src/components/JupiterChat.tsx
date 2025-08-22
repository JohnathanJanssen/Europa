import React, { useState, useEffect } from "react";
import { Mic, Send, Settings, Trash2, Terminal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJupiterASR } from "@/hooks/use-jupiter-asr";
import { useJupiterTTS } from "@/hooks/use-jupiter-tts";
import { useJupiterEmotion } from "@/hooks/use-jupiter-emotion";
import { useOpenAIChat } from "@/hooks/use-openai-chat";
import { useJupiterFiles } from "@/hooks/use-jupiter-files";
import { useJupiterTerminal } from "@/hooks/use-jupiter-terminal";
import { useGlowLevel } from "@/components/Waveform";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AnimatePresence, motion } from 'framer-motion';
import { chat, type Msg } from '../runtime/brain.ts';
import { startMicStream, detectSilence } from '../runtime/audio.ts';
import { startRecordingFromStream, transcribeOnce } from '../runtime/stt_hf.ts';
import { matchAction, performAction } from '../runtime/actions.ts';
import { webSpeechAvailable, getMicPermission } from '../runtime/cap.ts';
import FlipTile from './FlipTile';
import SpotlightCard from './SpotlightCard';
import ThoughtsBubble from './ThoughtsBubble';
import { uiBus } from '../runtime/uiBus';
import { visionBus } from '../runtime/visionBus';
import { speak } from '../runtime/voice';
import { think } from '../vision/thoughts/bus';

const SETTINGS_KEY = "jupiter_settings";
const CHAT_HISTORY_KEY = "jupiter_chat_history";
const defaultSettings = {
  voice: "default",
  model: "gpt-4",
  wakeWord: false,
  memoryLimit: 100,
  privacy: true,
};

export const JupiterChat: React.FC = () => {
  const [input, setInput] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [micState, setMicState] = useState<'idle'|'recording'|'transcribing'>('idle');
  const micStreamRef = React.useRef<MediaStream|null>(null);
  const silenceRef = React.useRef<{ stop():void }|null>(null);
  const recRef = React.useRef<{ stop():Promise<Blob> }|null>(null);
  const [isDropping, setIsDropping] = useState(false);
  const { startRecording: asrStartRecording, stopRecording: asrStopRecording, audioBlob, isTranscribing, transcript } = useJupiterASR();
  const { speak: ttsSpeak, isSpeaking } = useJupiterTTS();
  const { classifyEmotion } = useJupiterEmotion();
  const { sendMessage, messages, isLoading: openAiIsLoading } = useOpenAIChat();
  const navigate = useNavigate();

  useEffect(() => {
    const off = visionBus.onAskIdentity.on(({sig}) => {
      const line = "I don't recognize you yet. What should I call you?";
      think('requesting identity');
      const assistantMessage: (Msg & { id: string }) = { role: 'assistant', content: line, id: Date.now().toString() };
      setChatHistory(prev => [...prev, assistantMessage]);
      try { speak?.(line); } catch {}
      (window as any).__jupiter_waitingForName = true;
    });
    return () => off();
  }, []);

  // Hooks for tools
  const { runCommand } = useJupiterTerminal();
  const { listFiles, readFile, writeFile, deleteFile, createDirectory, renameFile } = useJupiterFiles();

  const toolImplementations = {
    run_command: runCommand,
    list_files: listFiles,
    read_file: readFile,
    write_file: writeFile,
    delete_file: deleteFile,
    create_directory: createDirectory,
    rename_file: renameFile, // Corrected: rename_file to renameFile
  };

  const [isLoading, setIsLoading] = useState(false);
  const glowLevel = useGlowLevel(micOn || isLoading);

  useEffect(() => {
    document.body.classList.add("dark");
    return () => document.body.classList.remove("dark");
  }, []);

  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [chatHistory, setChatHistory] = useState<(Msg & { id: string, imageUrl?: string })[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  }, [chatHistory]);

  async function handleUserText(text: string, imageUrl?: string) {
    const raw = text.trim();

    if ((window as any).__jupiter_waitingForName && raw) {
      (window as any).__jupiter_waitingForName = false;
      const name = raw.replace(/^i['’]m\s+/i,'').replace(/^my name is\s+/i,'').trim();
      visionBus.enroll({name});
      const line = `Nice to meet you, ${name}. I’ll remember you.`;
      const assistantMessage: (Msg & { id: string }) = { role: 'assistant', content: line, id: Date.now().toString() };
      setChatHistory(prev => [...prev, assistantMessage]);
      try { speak?.(line); } catch {}
      return;
    }

    const t = raw.toLowerCase();
    if (/^open (vision|camera)\b/.test(t)) { uiBus.openVision(); return; }
    if (/^open settings\b/.test(t))       { uiBus.openSettings(); return; }
    if (/^open terminal\b/.test(t))       { uiBus.openTerminal(); return; }
    if (/^close\b/.test(t))               { uiBus.back(); return; }

    if (!text.trim() && !imageUrl) return;
    setInput("");

    const action = matchAction(text);
    if (action) {
      await performAction(action);
      return;
    }

    const userMessage: (Msg & { id: string, imageUrl?: string }) = {
      role: 'user',
      content: text,
      id: Date.now().toString(),
      imageUrl,
    };

    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setIsLoading(true);

    try {
      const historyForApi = newHistory.map(({ role, content }) => ({ role, content }));
      const reply = await chat(historyForApi);
      await speak(reply);
      const assistantMessage: (Msg & { id: string }) = { role: 'assistant', content: reply, id: (Date.now() + 1).toString() };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error(e);
      toast.error("I was unable to get a reply. Please check your API keys.");
    } finally {
      setIsLoading(false);
    }
  }

  const onMicToggle = async () => {
    if (micOn) {
      setMicOn(false);
      silenceRef.current?.stop(); silenceRef.current = null;
      setMicState('transcribing');
      try {
        const blob = await recRef.current?.stop();
        recRef.current = null;
        try { micStreamRef.current?.getTracks().forEach(t=>t.stop()); } catch {}
        const text = blob ? await transcribeOnce(blob) : '';
        setMicState('idle');
        if (text) await handleUserText(text);
      } catch {
        setMicState('idle');
      } finally {
        micStreamRef.current = null;
      }
      return;
    }

    try {
      const stream = await startMicStream();
      micStreamRef.current = stream;
      recRef.current = await startRecordingFromStream(stream);
      silenceRef.current = detectSilence(stream, { silenceMs: 3000, threshold: 0.02 }, async () => {
        if (!micOn) return;
        await onMicToggle();
      });
      setMicOn(true);
      setMicState('recording');
    } catch (e) {
      toast.error('Microphone unavailable. Please allow it in your browser settings.');
    }
  };

  const handleSend = async (text: string, imageUrl?: string) => {
    if (!text.trim() && !imageUrl) return;
    await handleUserText(text, imageUrl);
  };

  const handleFileForChat = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        handleSend("Describe this image.", imageUrl);
        toast.success(`Image "${file.name}" loaded for analysis.`);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const message = `I have uploaded the file named "${file.name}". Its content is:\n\n---\n${content}\n---\n\nPlease analyze it.`;
        handleSend(message);
        toast.success(`File "${file.name}" loaded for analysis.`);
      };
      reader.readAsText(file);
    }
  };

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
    if (file) handleFileForChat(file);
  };

  const blue = [129, 140, 248];
  const purple = [168, 28, 175];
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const colorMix = (t: number) => `rgba(${Math.round(lerp(blue[0], purple[0], t))},${Math.round(lerp(blue[1], purple[1], t))},${Math.round(lerp(blue[2], purple[2], t))},${0.18 + glowLevel * 0.32})`;

  const chatUi = (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "110%", height: "120%", borderRadius: "32px",
          filter: `blur(${16 + glowLevel * 32}px)`, opacity: 0.55 + glowLevel * 0.35,
          background: `radial-gradient(ellipse at center, ${colorMix(glowLevel)} 0%, transparent 80%)`,
          transition: "filter 0.3s, opacity 0.3s, background 0.3s"
        }}
      />
      <div
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        className={`relative z-10 flex flex-col w-full bg-black/60 backdrop-blur-xl shadow-2xl border transition-all duration-300 p-3 rounded-2xl ${isDropping ? 'border-green-400' : 'border-[#2d2d4d]'}`}
        style={{
          minWidth: 340,
          boxShadow: `0 8px 32px 0 #000a, 0 1.5px 8px 0 #6366f133, 0 0 32px ${24 + glowLevel * 32}px ${colorMix(glowLevel)}`,
          outline: glowLevel > 0.01 || isDropping ? `2.5px solid ${isDropping ? '#4ade80' : colorMix(glowLevel)}` : "none",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white tracking-widest select-none" style={{ letterSpacing: 3 }}>JUPITER</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleClearChat} aria-label="Clear Chat" title="Clear Chat" className="text-gray-400 hover:text-pink-400"><Trash2 /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 bg-transparent max-h-[460px] py-2">
          {chatHistory.map((msg: any, index: number) => (
            <div key={msg.id || index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
        <div className="pt-0">
          <div className="flex items-center gap-2">
            <Button variant={micOn ? "destructive" : "outline"} size="icon" onClick={onMicToggle} aria-label="Push to talk" className={`rounded-full ${micOn ? "bg-pink-700" : "bg-gray-800"} text-white shadow`}>
              <Mic className={micOn ? "animate-pulse text-pink-400" : "text-blue-400"} />
            </Button>
            <div className="flex-1 flex flex-col">
              <div className="relative flex items-center">
                <Input
                  className="bg-[#18182a] text-white rounded-full border border-[#2d2d4d] px-4 py-2 focus:ring-2 focus:ring-blue-600 w-full"
                  placeholder={isDropping ? "Drop file to analyze" : "Type or drop a file…"}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSend(input); }}
                  disabled={isLoading}
                  style={{ fontSize: 16, background: "rgba(24,24,42,0.92)", boxShadow: "0 1.5px 8px 0 #6366f122", paddingRight: micState !== 'idle' ? '110px' : '1rem' }}
                />
                {micState !== 'idle' && (
                  <span className="absolute right-3 text-xs opacity-70 pointer-events-none">
                    {micState === 'recording' ? 'Recording…' : 'Transcribing…'}
                  </span>
                )}
              </div>
            </div>
            <Button onClick={() => handleSend(input)} disabled={isLoading || !input.trim()} size="icon" aria-label="Send" className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow">
              <Send />
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <FlipTile
      front={
        <div className="relative" data-jupiter-root>
          <ThoughtsBubble />
          <div className="absolute -top-3 right-2 z-40 flex gap-2">
            <button title="Vision" onClick={()=>uiBus.openVision()} className="text-xs bg-zinc-900/80 border border-zinc-800 rounded-md px-2 py-1">👁</button>
            <button title="Settings" onClick={()=>uiBus.openSettings()} className="text-xs bg-zinc-900/80 border border-zinc-800 rounded-md px-2 py-1">⚙︎</button>
            <button title="Terminal" onClick={()=>uiBus.openTerminal()} className="text-xs bg-zinc-900/80 border border-zinc-800 rounded-md px-2 py-1">⌥</button>
          </div>
          {chatUi}
        </div>
      }
      back={
        <div className="relative">
          <ThoughtsBubble />
          <div className="absolute -top-3 left-2 z-40">
            <button onClick={()=>uiBus.back()} className="text-xs bg-zinc-900/80 border border-zinc-800 rounded-md px-2 py-1">↩︎</button>
          </div>
          <SpotlightCard />
        </div>
      }
    />
  );
};