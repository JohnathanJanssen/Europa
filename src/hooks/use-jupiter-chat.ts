import { useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  emotion?: { label: string; confidence: number };
};

export function useJupiterChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Integrate with backend API for LLM, memory, streaming, etc.

  const sendMessage = async ({
    text,
    audio,
    emotion,
    onStream,
    onDone,
  }: {
    text: string;
    audio?: Blob;
    emotion?: { label: string; confidence: number };
    onStream?: (partial: string, audioUrl?: string) => void;
    onDone?: (final: string, audioUrl?: string) => void;
  }) => {
    setIsLoading(true);
    const userMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      text,
      emotion,
    };
    setMessages((prev) => [...prev, userMsg]);
    // Simulate streaming reply
    let reply = "Hello! I'm Jupiter. How can I help you today?";
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      onStream?.(reply.slice(0, i));
      if (i >= reply.length) {
        clearInterval(interval);
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          text: reply,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
        onDone?.(reply);
      }
    }, 40);
  };

  return {
    messages,
    isLoading,
    sendMessage,
  };
}