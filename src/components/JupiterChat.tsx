import React, { useState, useRef, useEffect } from "react";
import { Mic, Send, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJupiterASR } from "@/hooks/use-jupiter-asr";
import { useJupiterTTS } from "@/hooks/use-jupiter-tts";
import { useJupiterEmotion } from "@/hooks/use-jupiter-emotion";
import { useOpenAIChat } from "@/hooks/use-openai-chat";
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
  const [streamingReply, setStreamingReply] = useState("");
  const [streamingAudioUrl, setStreamingAudioUrl] = useState<string | null>(null);
  const { startRecording, stopRecording, audioBlob, isTranscribing, transcript } = useJupiterASR();
  const { speak, isSpeaking } = useJupiterTTS();
  const { classifyEmotion } = useJupiterEmotion();
  const { sendMessage, messages, isLoading } = useOpenAIChat();
  const navigate = useNavigate();

  // Glow intensity for the widget border and aura
  const glowLevel = useGlowLevel(isRecording || isSpeaking);

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

  // Watch for settings changes in localStorage (in case user changes them in another tab)
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

  // On mount, load chat history into useOpenAIChat if available
  useEffect(() => {
    if (chatHistory.length > 0 && messages.length === 0) {
      // This is a hack: we can't set messages in useOpenAIChat directly,
      // but for a real app, you'd want to lift state up or use a context/store.
      // For now, just display chatHistory as a fallback.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setPendingSend(true); // Wait for audioBlob/transcript to update
  };

  // When audioBlob and transcript are ready after recording, send the message
  useEffect(() => {
    if (
      pendingSend &&
      audioBlob &&
      !isRecording &&
      !isTranscribing
    ) {
      const text = transcript || "";
      setInput(text);
      if (!text) {
        toast.error("Speech recognition failed. Please try again.");
      } else {
        handleSend(text, audioBlob);
      }
      setPendingSend(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSend, audioBlob, transcript, isRecording, isTranscribing]);

  // Handle text send
  const handleSend = async (text: string, audio?: Blob) => {
    if (!text.trim()) return;
    setInput("");
    // Emotion classification
    await classifyEmotion(text);
    // Send to Jupiter with selected model
    sendMessage({
      text,
      model: settings.model === "gpt-3.5" ? "gpt-3.5-turbo" : (settings.model === "gpt-4" ? "gpt-4o" : settings.model),
      onStream: (partial: string) => {
        setStreamingReply(partial);
      },
      onDone: (final: string) => {
        setStreamingReply("");
        setStreamingAudioUrl(null);
        // Pass selected voice to TTS (future extensibility)
        speak(final, settings.voice)
          .catch(() => {
            toast.error("Text-to-speech failed.");
          });
        toast.success("Message sent!");
      },
    });
  };

  // Clear chat handler
  const handleClearChat = () => {
    setChatHistory([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    toast.success("Chat history cleared.");
    // Optionally, reload the page or reset messages in useOpenAIChat if possible
  };

  // Use chatHistory as fallback if messages is empty
  const displayMessages = messages.length > 0 ? messages : chatHistory;

  // Animated glow style for border and aura
  // Color shifts between blue and purple as it pulses
  const blue = [129, 140, 248];
  const purple = [168, 28, 175];
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const colorMix = (t: number) =>
    `rgba(${Math.round(lerp(blue[0], purple[0], t))},${Math.round(
      lerp(blue[1], purple[1], t)
    )},${Math.round(lerp(blue[2], purple[2], t))},${0.18 + glowLevel * 0.32})`;

  // For the aura, use a blurred absolutely positioned div behind the widget
  // The border and box-shadow are also animated
  return (
    <div className="relative flex items-center justify-center min-h-[70vh]">
      {/* Animated aura glow */}
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
      {/* Widget */}
      <div
        className="relative z-10 flex flex-col w-full max-w-md mx-auto bg-black/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#2d2d4d] p-2 transition-shadow duration-300"
        style={{
          minWidth: 340,
          boxShadow: `0 8px 32px 0 #000a, 0 1.5px 8px 0 #6366f133, 0 0 32px ${24 + glowLevel * 32}px ${colorMix(glowLevel)}`,
          outline: glowLevel > 0.01 ? `2.5px solid ${colorMix(glowLevel)}` : "none",
          transition: "box-shadow 0.3s, outline 0.3s"
        }}
      >
        <div className="flex items-center justify-between p-2 pb-0">
          <span className="text-lg font-bold text-white tracking-widest select-none" style={{ letterSpacing: 3 }}>JUPITER</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              aria-label="Clear Chat"
              title="Clear Chat"
              className="text-gray-400 hover:text-pink-400"
            >
              <Trash2 />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="text-gray-400 hover:text-blue-400"
            >
              <Settings />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-transparent">
          {displayMessages.map((msg: any) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`rounded-2xl px-4 py-2 max-w-[80%] shadow ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-700 text-white font-semibold"
                    : "bg-gradient-to-r from-gray-800 via-gray-900 to-black text-blue-100"
                }`}
              >
                <div>{msg.text}</div>
                {msg.emotion && (
                  <div className="text-xs mt-1 text-blue-300 opacity-80">
                    Emotion: {msg.emotion.label} ({Math.round(msg.emotion.confidence * 100)}%)
                  </div>
                )}
              </div>
            </div>
          ))}
          {streamingReply && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2 bg-gradient-to-r from-gray-800 via-gray-900 to-black text-blue-100 animate-pulse max-w-[80%] shadow">
                {streamingReply}
              </div>
            </div>
          )}
        </div>
        <div className="p-2 pt-0 flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onMouseDown={handleMicDown}
            onMouseUp={handleMicUp}
            aria-label="Push to talk"
            className={`rounded-full ${isRecording ? "bg-pink-700" : "bg-gray-800"} text-white shadow`}
          >
            <Mic className={isRecording ? "animate-pulse text-pink-400" : "text-blue-400"} />
          </Button>
          <div className="flex-1 flex flex-col">
            <Input
              className="bg-[#18182a] text-white rounded-full border border-[#2d2d4d] px-4 py-2 focus:ring-2 focus:ring-blue-600"
              placeholder="Type…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleSend(input);
              }}
              disabled={isLoading}
              style={{
                fontSize: 16,
                background: "rgba(24,24,42,0.92)",
                boxShadow: "0 1.5px 8px 0 #6366f122",
              }}
            />
          </div>
          <Button
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim()}
            size="icon"
            aria-label="Send"
            className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow"
          >
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
};