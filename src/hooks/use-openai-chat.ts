import { useState } from "react";
import { JUPITER_PERSONALITY } from "@/personality/jupiter";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const DEFAULT_MODEL = "gpt-4o"; // You can change to gpt-3.5-turbo if needed

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  emotion?: { label: string; confidence: number };
};

export function useOpenAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async ({
    text,
    onStream,
    onDone,
    model = DEFAULT_MODEL,
  }: {
    text: string;
    onStream?: (partial: string) => void;
    onDone?: (final: string) => void;
    model?: string;
  }) => {
    setIsLoading(true);
    const userMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      text,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Prepare OpenAI chat messages
    const chatHistory = [
      { role: "system", content: JUPITER_PERSONALITY },
      ...messages.map((m) => ({
        role: m.role,
        content: m.text,
      })),
      { role: "user", content: text },
    ];

    // Stream from OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: chatHistory,
        stream: true,
        temperature: 0.5,
        max_tokens: 512,
      }),
    });

    if (!response.body) {
      setIsLoading(false);
      onDone?.("Sorry, no response.");
      return;
    }

    const reader = response.body.getReader();
    let result = "";
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // OpenAI streams as "data: ..." lines
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          const data = line.replace("data: ", "").trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              result += content;
              onStream?.(result);
            }
          } catch {}
        }
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        text: result,
      },
    ]);
    setIsLoading(false);
    onDone?.(result);
  };

  return {
    messages,
    isLoading,
    sendMessage,
  };
}