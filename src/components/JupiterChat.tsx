import React, { useState, useRef, useEffect } from "react";
import { Mic, Send, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useJupiterASR } from "@/hooks/use-jupiter-asr";
import { useJupiterTTS } from "@/hooks/use-jupiter-tts";
import { useJupiterEmotion } from "@/hooks/use-jupiter-emotion";
import { useOpenAIChat } from "@/hooks/use-openai-chat";
import { Waveform } from "@/components/Waveform";
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
  const waveformRef = useRef<HTMLCanvasElement>(null);

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

  return (
    <div className="flex flex-col h-[90vh] max-w-xl mx-auto">
      <div className="flex items-center justify-between p-2">
        <h2 className="text-xl font-bold">Jupiter</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            aria-label="Clear Chat"
            title="Clear Chat"
          >
            <Trash2 />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <Settings />
          </Button>
        </div>
      </div>
      <Card className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {displayMessages.map((msg: any) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              <div>{msg.text}</div>
              {msg.emotion && (
                <div className="text-xs mt-1 text-gray-500">Emotion: {msg.emotion.label} ({Math.round(msg.emotion.confidence * 100)}%)</div>
              )}
            </div>
          </div>
        ))}
        {streamingReply && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 bg-secondary animate-pulse max-w-[80%]">
              {streamingReply}
            </div>
          </div>
        )}
      </Card>
      <div className="p-2 flex items-center gap-2">
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          onMouseDown={handleMicDown}
          onMouseUp={handleMicUp}
          aria-label="Push to talk"
        >
          <Mic className={isRecording ? "animate-pulse text-red-500" : ""} />
        </Button>
        <div className="flex-1">
          <Input
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleSend(input);
            }}
            disabled={isLoading}
          />
        </div>
        <Button onClick={() => handleSend(input)} disabled={isLoading || !input.trim()} size="icon" aria-label="Send">
          <Send />
        </Button>
      </div>
      <div className="h-12 flex items-center px-2">
        <Waveform isActive={isRecording || isSpeaking} ref={waveformRef} />
      </div>
    </div>
  );
};