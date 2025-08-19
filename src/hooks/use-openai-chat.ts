import { useState } from "react";
import { JUPITER_PERSONALITY } from "@/personality/jupiter";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const DEFAULT_MODEL = "gpt-4o";

type Message = {
  id: string;
  role: "user" | "assistant" | "tool";
  text: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
};

const tools = [
  {
    type: "function",
    function: {
      name: "run_command",
      description: "Executes a shell command in the terminal.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The shell command to execute.",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "Lists files and directories at a given path.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The directory path to list files from. Defaults to the root.",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Reads the content of a file at a given path.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path of the file to read.",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Writes content to a file at a given path.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path of the file to write to.",
          },
          content: {
            type: "string",
            description: "The content to write to the file.",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Deletes a file at a given path.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path of the file to delete.",
          },
        },
        required: ["path"],
      },
    },
  },
];

export function useOpenAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async ({
    text,
    onStream,
    onDone,
    model = DEFAULT_MODEL,
    toolImplementations,
  }: {
    text: string;
    onStream?: (partial: string) => void;
    onDone?: (final: string) => void;
    model?: string;
    toolImplementations: { [key: string]: (...args: any[]) => Promise<any> };
  }) => {
    setIsLoading(true);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    if (!OPENAI_API_KEY) {
      // Handle preview mode
      const previewReply = "That is correct. (This is a preview response from Jupiter.)";
      setTimeout(() => {
        onStream?.(previewReply);
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", text: previewReply },
        ]);
        setIsLoading(false);
        onDone?.(previewReply);
      }, 1000);
      return;
    }

    const history = newMessages.map(m => ({
      role: m.role,
      content: m.text,
      tool_calls: m.tool_calls,
    }));

    const runConversation = async (currentMessages: any[]) => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: JUPITER_PERSONALITY }, ...currentMessages],
          tools: tools,
          tool_choice: "auto",
        }),
      });

      const responseData = await response.json();
      const responseMessage = responseData.choices[0].message;
      currentMessages.push(responseMessage);

      const toolCalls = responseMessage.tool_calls;
      if (toolCalls) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: 'Using tools...', tool_calls: toolCalls }]);
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionToCall = toolImplementations[functionName];
          const functionArgs = JSON.parse(toolCall.function.arguments);
          const functionResponse = await functionToCall(...Object.values(functionArgs));
          
          currentMessages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(functionResponse),
          });
        }
        await runConversation(currentMessages);
      } else {
        // No tool calls, stream the final response
        const finalResponse = responseMessage.content;
        let i = 0;
        const interval = setInterval(() => {
          i += 2;
          onStream?.(finalResponse.slice(0, i));
          if (i >= finalResponse.length) {
            clearInterval(interval);
            setMessages((prev) => [
              ...prev,
              { id: (Date.now() + 1).toString(), role: "assistant", text: finalResponse },
            ]);
            setIsLoading(false);
            onDone?.(finalResponse);
          }
        }, 20);
      }
    };

    await runConversation(history);
  };

  return {
    messages,
    isLoading,
    sendMessage,
  };
}