import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("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");

const cleanText = (text: string) =>
  text
    .replace(/[*#_`>]+/g, ""); // Remove *, #, _, `, > characters

const ChatWithAI = ({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! Any Emergency I can Help with?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const chatCompletion = await client.chatCompletion({
        provider: "auto",
        model: "deepseek-ai/DeepSeek-R1-0528",
        messages: [
          ...messages,
          userMsg
        ].map(({ role, content }) => ({ role, content })),
      });
      const answer = chatCompletion.choices[0].message.content
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<think>[\\s\\S]*?\\n/gi, "")
        .trim();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleanText(answer || "...") }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't respond right now." }
      ]);
    }
    setLoading(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div
        className="bg-gradient-to-br from-liberia-blue via-slate-900 to-liberia-blue rounded-t-2xl shadow-xl w-full max-w-sm m-0 flex flex-col"
        style={{
          height: "100dvh", // Dynamic viewport height for mobile keyboard
          maxHeight: "100dvh",
        }}
      >
        <div className="flex justify-between items-center px-4 pt-4 pb-2 border-b border-white/10">
          <h2 className="font-bold text-lg text-white">Alert Liberia AI</h2>
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white">Close</Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2 bg-white/5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-3 py-2 rounded-xl max-w-[80%] text-sm ${
                  msg.role === "user"
                    ? "bg-liberia-red text-white"
                    : "bg-white/80 text-black"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-b-2xl">
          <input
            className="flex-1 border border-white/20 bg-white/80 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-liberia-blue"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={loading}
            // This helps on iOS to keep input above keyboard
            style={{ WebkitUserSelect: "text" }}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-liberia-red text-white rounded-full px-4 py-2"
          >
            {loading ? "..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWithAI;