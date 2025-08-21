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
import { useSpotlight } from '@/state/spotlight';
import { SpotlightCard } from '@/components/SpotlightCard';
import { AnimatePresence, motion } from 'framer-motion';
import { chat, type Msg } from '../runtime/brain.ts';
import { speak } from '../runtime/voice.ts';
import { startListening, type ListenCtrl } from '../runtime/listen.ts';
import { startWakeWord, type WakeCtrl } from '../runtime/wake.ts';
import { registerSpotlight, type Panel } from '../runtime/ui.ts';
import { matchAction, performAction } from '../runtime/actions.ts';
import { PanelType } from '@/state/spotlight'; // Import PanelType for mapping
import { webSpeechAvailable, getMicPermission } from '../runtime/cap.ts';
import { startRecording, transcribeOnce, type RecorderCtrl } from '../runtime/stt_hf.ts';

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
  const [micState, setMicState] = useState<'idle'|'listening'|'recording'|'transcribing'>('idle');
  const wakeCtrlRef = React.useRef<WakeCtrl | null>(null);
  const recRef = React.useRef<RecorderCtrl | null>(null);
  const listenCtrlRef = React.useRef<ListenCtrl | null>(null);
  const [isDropping, setIsDropping] = useState(false);
  const { startRecording: asrStartRecording, stopRecording: asrStopRecording, audioBlob, isTranscribing, transcript } = useJupiterASR();
  const { speak: ttsSpeak, isSpeaking } = useJupiterTTS();
  const { classifyEmotion } = useJupiterEmotion();
  const { sendMessage, messages, isLoading: openAiIsLoading } = useOpenAIChat();
  const navigate = useNavigate();
  const spotlight = useSpotlight();

  useEffect(() => {
    registerSpotlight({
      open(panel?: Panel) {
        if (panel === 'home' || !panel) {
          spotlight.setVisible(true);
        } else {
          // Cast Panel to PanelType as they align for 'settings', 'terminal', 'vision'
          spotlight.open(panel as PanelType, null, panel.charAt(0).toUpperCase() + panel.slice(1));
        }
      },
      close() {
        spotlight.setVisible(false);
      }
    });
  }, [spotlight]);

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
    rename_file: renameFile,
  };

  const [isLoading, setIsLoading] = useState(false);
  const glowLevel = useGlowLevel(micOn || isSpeaking || isLoading || spotlight.isVisible);

  useEffect(() => {
    document.body.classList.add("dark");
    return () => document.body.classList.remove("dark");
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        spotlight.setVisible(false);
      }
      if (e.key.toLowerCase() === 'l' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        spotlight.toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [spotlight]);

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
    const onStorage = (e: StorageEvent) => {
      if (e.key === SETTINGS_KEY && e.newValue) {
        setSettings({ ...defaultSettings, ...JSON.parse(e.newValue) });
      }
      if (e.key === CHAT_HISTORY_KEY && e.newValue) {
        setChatHistory(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  }, [chatHistory]);

  const [pendingSend, setPendingSend] = useState(false);

  async function handleUserText(text: string, imageUrl?: string) {
    if (!text.trim() && !imageUrl) return;
    setInput("");

    const action = matchAction(text);
    if (action) {
      await performAction(action);
      return; // Do not send to LLM if an action was performed
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
    // Turning OFF:
    if (micOn) {
      setMicOn(false);
      setMicState('idle');
      try { wakeCtrlRef.current?.stop(); wakeCtrlRef.current = null; } catch {}
      try { listenCtrlRef.current?.stop(); listenCtrlRef.current = null; } catch {}
      try {
        if (recRef.current) {
          setMicState('transcribing');
          const blob = await recRef.current.stop();
          recRef.current = null;
          const text = await transcribeOnce(blob);
          setMicState('idle');
          if (text) await handleUserText(text);
        }
      } catch(e) {
        setMicState('idle');
        console.error(e);
        toast.error("Could not transcribe audio. Check HF token.");
      }
      return;
    }

    // Turning ON:
    const allow = await getMicPermission();
    if (allow === 'denied') {
      toast.error('Microphone is blocked. Please allow it in your browser settings.');
      return;
    }

    setMicOn(true);
    if (webSpeechAvailable() && settings.wakeWord) {
      setMicState('listening');
      wakeCtrlRef.current = startWakeWord(async (utterance) => {
        await handleUserText(utterance);
      }, {
        onHeard: (_t, _f) => {}, // keep quiet; Jupiter speaks only when relevant
      });
      return;
    }
    
    // Fallback push-to-talk:
    setMicState('recording');
    try {
      recRef.current = await startRecording();
    } catch (e) {
      console.error(e);
      toast.error("Could not start recording. Is the mic connected?");
      setMicOn(false);
      setMicState('idle');
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileForChat(file);
    }
  };

  const handleVisionToggle = () => {
    const visionPanel = spotlight.panels.find(p => p.type === 'vision');
    if (visionPanel) {
      spotlight.close(visionPanel.id);
    } else {
      spotlight.open('vision', null, 'Vision');
    }
  };

  const displayMessages = chatHistory;

  const blue = [129, 140, 248];
  const purple = [168, 28, 175];
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const colorMix = (t: number) =>
    `rgba(${Math.round(lerp(blue[0], purple[0], t))},${Math.round(
      lerp(blue[1], purple[1], t)
    )},${Math.round(lerp(blue[2], purple[2], t))},${0.18 + glowLevel * 0.32})`;

  return (
    <div className="relative flex items-center justify-center min-h-[70vh] py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "110%",
          height: "120%",
          borderRadius: "32px",
          filter: `blur(${16 + glowLevel * 32}px)`,
          opacity: 0.55 + glowLevel * 0.35,
          background: `radial-gradient(ellipse at center, ${colorMix(glowLevel)} 0%, transparent 80%)`,
          transition: "filter 0.3s, opacity 0.3s, background 0.3s"
        }}
      />
      <div className="relative z-10 flex flex-col w-full max-w-md mx-auto">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative z-10 flex flex-col w-full bg-black/60 backdrop-blur-xl shadow-2xl border transition-all duration-300 ${isDropping ? 'border-green-400' : 'border-[#2d2d4d]'} ${spotlight.isVisible ? 'rounded-t-2xl border-b-0' : 'rounded-2xl'}`}
          style={{
            minWidth: 340,
            boxShadow: `0 8px 32px 0 #000a, 0 1.5px 8px 0 #6366f133, 0 0 32px ${24 + glowLevel * 32}px ${colorMix(glowLevel)}`,
            outline: glowLevel > 0.01 || isDropping ? `2.5px solid ${isDropping ? '#4ade80' : colorMix(glowLevel)}` : "none",
          }}
        >
          <div className="flex items-center justify-between p-2 pb-0">
            <span className="text-lg font-bold text-white tracking-widest select-none" style={{ letterSpacing: 3 }}>JUPITER</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handleClearChat} aria-label="Clear Chat" title="Clear Chat" className="text-gray-400 hover:text-pink-400"><Trash2 /></Button>
              <Button variant="ghost" size="icon" onClick={() => spotlight.open('terminal', null, 'Terminal')} className="text-gray-400 hover:text-green-400" title="Open Terminal" aria-label="Open Terminal"><Terminal /></Button>
              <Button variant="ghost" size="icon" onClick={() => spotlight.open('settings', null, 'Settings')} className="text-gray-400 hover:text-blue-400" title="Open Settings" aria-label="Open Settings"><Settings /></Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-transparent max-h-[50vh]">
            {displayMessages.map((msg: any, index: number) => (
              <div key={msg.id || index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-2 max-w-[80%] shadow ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-700 text-white font-semibold"
                      : "bg-gradient-to-r from-gray-800 via-gray-900 to-black text-blue-100"
                  }`}
                >
                  {msg.imageUrl && <img src={msg.imageUrl} alt="User content" className="rounded-lg mb-2 max-w-full h-auto" />}
                  <div>{msg.content || msg.text}</div>
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
          <div className="p-2 pt-0">
            <div className="flex items-center gap-2">
              <Button variant={micOn ? "destructive" : "outline"} size="icon" onClick={onMicToggle} aria-label="Push to talk" className={`rounded-full ${micOn ? "bg-pink-700" : "bg-gray-800"} text-white shadow`}>
                <Mic className={micOn ? "animate-pulse text-pink-400" : "text-blue-400"} />
              </Button>
              <Button variant="outline" size="icon" aria-label="Toggle Vision" data-state={spotlight.panels.some(p => p.type === 'vision') ? 'open' : 'closed'} className="rounded-full bg-gray-800 text-white shadow data-[state=open]:bg-blue-900 data-[state=open]:text-blue-300" onClick={handleVisionToggle}>
                <Eye />
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
                      {micState === 'listening' ? 'Listening…' :
                       micState === 'recording' ? 'Recording…' :
                       'Transcribing…'}
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
        <AnimatePresence>
          {spotlight.isVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full"
            >
              <SpotlightCard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};