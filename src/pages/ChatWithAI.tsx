import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InferenceClient } from "@huggingface/inference";
import { Volume2 } from "lucide-react";

const client = new InferenceClient("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");

const cleanText = (text: string) =>
  text
    .replace(/[*#_`>]+/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/(\d+\.)/g, "\n $1")
    .replace(/\n\s*\n/g, "\n\n")
    .replace(/^\s+|\s+$/g, "");

// --- Only show English voices in the dropdown ---
const isIOS = typeof window !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);

const getVoices = () => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    // On iOS, only use "American (Voice 1)" or Samantha
    if (isIOS) {
      return window.speechSynthesis.getVoices().filter(
        v =>
          (v.name === "Samantha" && v.lang === "en-US") ||
          v.name === "American (Voice 1)"
      );
    }
    // On other OS, pick only one English voice (prefer en-US, fallback to any en)
    const englishVoices = window.speechSynthesis.getVoices().filter(
      v => v.lang && v.lang.toLowerCase().startsWith("en")
    );
    // Prefer a voice with "female" in the name, then en-US, then any en
    const femaleVoice = englishVoices.find(v => /female|woman|girl/i.test(v.name));
    if (femaleVoice) return [femaleVoice];
    const enUS = englishVoices.find(v => v.lang === "en-US");
    if (enUS) return [enUS];
    if (englishVoices.length > 0) return [englishVoices[0]];
    return [];
  }
  return [];
};

// Add this helper function at the top (outside your component)
function resetViewportScale() {
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    // Reset the scale to 1.0
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=0.8, maximum-scale=0.8, user-scalable=0'
    );
    // Allow user to zoom again after a short delay
    setTimeout(() => {
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=0.8, maximum-scale=0.8, user-scalable=0'
      );
    }, 300);
  }
}

const ChatWithAI = ({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! Any Emergency I can Help with?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [voiceRate, setVoiceRate] = useState<number>(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
      const v = getVoices();
      setVoices(v);
      if (v.length && !selectedVoice) setSelectedVoice(v[0].name);
    };
    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Updated: Text-to-speech function with voice and rate ---
  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = voiceRate;
      let voiceObj;
      if (isIOS) {
        // On iOS, force American (Voice 1) or fallback to Samantha
        voiceObj = voices.find(
          v =>
            (v.name === "Samantha" && v.lang === "en-US") ||
            v.name === "American (Voice 1)"
        );
      } else {
        voiceObj = voices.find(v => v.name === selectedVoice);
      }
      if (voiceObj) utterance.voice = voiceObj;
      window.speechSynthesis.speak(utterance);
    }
  };

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

  // Animated dots for loading
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setDotCount((prev) => (prev % 3) + 1);
      }, 400);
      return () => clearInterval(interval);
    } else {
      setDotCount(1);
    }
  }, [loading]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-end">
      <div className="bg-gradient-to-br from-liberia-blue via-slate-900 to-liberia-blue rounded-t-2xl shadow-xl w-full max-w-sm p-0 m-4 flex flex-col">
        <div className="flex justify-between items-center px-4 pt-4 pb-2 border-b border-white/10">
          <h2 className="font-bold text-lg text-white">Alert Liberia AI</h2>
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white">Close</Button>
        </div>
        {/* --- Voice and speed controls --- */}
        {/* Control area removed */}
        <div className="h-80 overflow-y-auto px-4 py-2 bg-white/5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end`}
            >
              {/* Message bubble */}
              <div
                className={`px-3 py-2 rounded-xl max-w-[80%] text-sm ${
                  msg.role === "user"
                    ? "bg-liberia-red text-white"
                    : "bg-white/80 text-black"
                }`}
                style={{ whiteSpace: "pre-line" }}
              >
                {msg.content}
              </div>
              {/* Volume button for AI responses, outside the bubble */}
              {msg.role === "assistant" && (
                <button
                  type="button"
                  className="ml-2 mb-1 bg-transparent text-white hover:text-white"
                  aria-label="Listen to response"
                  onClick={() => speak(msg.content)}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          {/* AI typing animation */}
          {loading && (
            <div className="mb-2 flex justify-start">
              <div className="px-3 py-2 rounded-xl max-w-[80%] text-sm bg-white/80 text-black flex items-center gap-1">
                <span>AI is typing</span>
                <span className="animate-pulse" style={{ width: 24, display: "inline-block" }}>
                  {".".repeat(dotCount)}
                </span>
              </div>
            </div>
          )}
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
            onBlur={resetViewportScale}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-liberia-red text-white rounded-full px-4 py-2"
          >
            {loading ? (
              <span>
                {"...".slice(0, dotCount)}
                <span className="sr-only">Sending</span>
              </span>
            ) : (
              "Send"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWithAI;