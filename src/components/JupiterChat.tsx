import React, { useState, useRef, useEffect } from "react";
import { Mic, Send, Settings, Trash2, Terminal } from "lucide-react";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [streamingReply, setStreamingReply] = useState("");
  const [streamingAudioUrl, setStreamingAudioUrl] = useState<string | null>(null);
  const { startRecording, stopRecording, audioBlob, isTranscribing, transcript } = useJupiterASR();
  const { speak, isSpeaking } = useJupiterTTS();
  const { classifyEmotion } = useJupiterEmotion();
  const { sendMessage, messages, isLoading } = useOpenAIChat();
  const navigate = useNavigate();

  // Hooks for tools
  const { runCommand } = useJupiterTerminal();
  const { listFiles, readFile, writeFile, deleteFile } = useJupiterFiles();

  const toolImplementations = {
    run_command: runCommand,
    list_files: listFiles,
    read_file: readFile,
    write_file: writeFile,
    delete_file: deleteFile,
  };

  // Glow intensity for the widget border and aura
  const glowLevel = useGlowLevel(isRecording || isSpeaking || isLoading);

  // Force dark mode on mount
  useEffect(() => {
    document.body.classList.add("dark");
    return () => document.body.classList.remove("dark");
  }, []);

  // Settings state
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Chat history state
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Watch for settings changes in localStorage
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

  // Sync chat history with messages from useOpenAIChat
  useEffect(() => {
    setChatHistory(messages);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  // Track if we should send after recording
  const [pendingSend, setPendingSend] = useState(false);

  // Handle push-to-talk
  const handleMicDown = () => {
    setIsRecording(true);
    startRecording();
  };
  const handleMicUp = async () => {
    setIsRecording(false);
    await stopRecording();
    setPendingSend(true);
  };

  // When audioBlob and transcript are ready after recording, send the message
  useEffect(() => {
    if (pendingSend && audioBlob && !isRecording && !isTranscribing) {
      const text = transcript || "";
      setInput(text);
      if (!text) {
        toast.error("Speech recognition failed. Please try again.");
      } else {
        handleSend(text);
      }
      setPendingSend(false);
    }
  }, [pendingSend, audioBlob, transcript, isRecording, isTranscribing]);

  // Handle text send
  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setInput("");
    await classifyEmotion(text);
    sendMessage({
      text,
      model: settings.model === "gpt-3.5" ? "gpt-3.5-turbo" : (settings.model === "gpt-4" ? "gpt-4o" : settings.model),
      toolImplementations,
      onStream: () => {
        // Do nothing here to embody Jupiter's deliberate, non-streamed thought process.
      },
      onDone: (final: string) => {
        setStreamingReply("");
        setStreamingAudioUrl(null);
        // A deliberate pause before speaking, reflecting Jupiter's thoughtful nature.
        setTimeout(() => {
          speak(final, settings.voice).catch(() => {
            toast.error("Text-to-speech failed.");
          });
        }, 500);
        toast.success("Response received.");
      },
    });
  };

  // Clear chat handler
  const handleClearChat = () => {
    setChatHistory([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    // This is a bit of a hack; a proper state management solution (like Zustand or Redux)
    // would allow resetting the hook's state directly. For now, we reload.
    window.location.reload();
    toast.success("Chat history cleared.");
  };

  // Drag and drop handlers
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
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const message = `I have uploaded the file named "${file.name}". Its content is:\n\n---\n${content}\n---\n\nPlease analyze it and let me know what you find.`;
        handleSend(message);
        toast.success(`File "${file.name}" loaded. Asking Jupiter to analyze.`);
      };
      reader.readAsText(file);
    }
  };

  const displayMessages = messages.length > 0 ? messages : chatHistory;

  const blue = [129, 140, 248];
  const purple = [168, 28, 175];
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const colorMix = (t: number) =>
    `rgba(${Math.round(lerp(blue[0], purple[0], t))},${Math.round(
      lerp(blue[1], purple[1], t)
    )},${Math.round(lerp(blue[2], purple[2], t))},${0.18 + glowLevel * 0.32})`;

  return (
    <div className="relative flex items-center justify-center min-h-[70vh]">
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
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative z-10 flex flex-col w-full max-w-md mx-auto bg-black/60 backdrop-blur-xl rounded-2xl shadow-2xl border transition-all duration-300 ${isDropping ? 'border-green-400' : 'border-[#2d2d4d]'}`}
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/tools")} className="text-gray-400 hover:text-green-400" title="Open Tools" aria-label="Open Tools"><Terminal /></Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-gray-400 hover:text-blue-400"><Settings /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-transparent">
          {displayMessages.map((msg: any, index: number) => (
            <div key={msg.id || index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`rounded-2xl px-4 py-2 max-w-[80%] shadow ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-700 text-white font-semibold"
                    : "bg-gradient-to-r from-gray-800 via-gray-900 to-black text-blue-100"
                }`}
              >
                <div>{msg.text}</div>
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
        <div className="p-2 pt-0 flex items-center gap-2">
          <Button variant={isRecording ? "destructive" : "outline"} size="icon" onMouseDown={handleMicDown} onMouseUp={handleMicUp} aria-label="Push to talk" className={`rounded-full ${isRecording ? "bg-pink-700" : "bg-gray-800"} text-white shadow`}>
            <Mic className={isRecording ? "animate-pulse text-pink-400" : "text-blue-400"} />
          </Button>
          <div className="flex-1 flex flex-col">
            <Input
              className="bg-[#18182a] text-white rounded-full border border-[#2d2d4d] px-4 py-2 focus:ring-2 focus:ring-blue-600"
              placeholder={isDropping ? "Drop file to analyze" : "Type or drop a file…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(input); }}
              disabled={isLoading}
              style={{ fontSize: 16, background: "rgba(24,24,42,0.92)", boxShadow: "0 1.5px 8px 0 #6366f122" }}
            />
          </div>
          <Button onClick={() => handleSend(input)} disabled={isLoading || !input.trim()} size="icon" aria-label="Send" className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow">
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
};