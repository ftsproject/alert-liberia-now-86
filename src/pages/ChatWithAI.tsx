import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InferenceClient } from "@huggingface/inference";
import { Volume2, Mic } from "lucide-react";

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

type FAQEntry = {
  questions: string[];
  answers: string[];
  isRegex?: boolean;
};

function getFAQAnswer(input: string, faqs: FAQEntry[]): string | null {
  for (const { questions, answers, isRegex } of faqs) {
    for (const q of questions) {
      if (
        isRegex
          ? new RegExp(q, "i").test(input)
          : input.toLowerCase().includes(q.toLowerCase())
      ) {
        // Pick a random answer if multiple
        return answers[Math.floor(Math.random() * answers.length)];
      }
    }
  }
  return null;
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
  const [faqAnswers, setFaqAnswers] = useState<FAQEntry[]>([]);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Load FAQ answers from JSON
  useEffect(() => {
    import("../data/faq_answers.json").then((mod) => {
      // Normalize all entries to have questions[] and answers[]
      const faqs = (mod.default || mod).map((entry: any) => ({
        questions: entry.questions || (entry.question ? [entry.question] : []),
        answers: entry.answers || (entry.answer ? [entry.answer] : []),
        isRegex: entry.isRegex,
      }));
      setFaqAnswers(faqs);
    });
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

    // --- FAQ/Help Layer ---
    const faqAnswer = getFAQAnswer(input, faqAnswers);
    if (faqAnswer) {
      // Simulate typing delay for FAQ answers
      const delay = 2000 + Math.random() * 1000; // 2-3 seconds
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: faqAnswer }
        ]);
        setLoading(false);
      }, delay);
      return;
    }

    // --- Fallback to AI ---
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

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault(); // Prevent newline
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

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

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
                <span className="flex gap-1 ml-2">
                  <span className="w-2 h-2 bg-liberia-blue rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-liberia-blue rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-liberia-blue rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-b-2xl">
          <textarea
            ref={textareaRef}
            className="flex-1 border border-white/30 bg-white/90 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-liberia-blue resize-none max-h-40 min-h-[40px] transition-all shadow-inner overflow-y-auto hide-scrollbar"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={loading}
            onBlur={resetViewportScale}
            rows={1}
          />
          <button
            type="button"
            aria-label={isListening ? "Stop listening" : "Start listening"}
            onClick={isListening ? stopListening : startListening}
            className={`rounded-full p-2 ${isListening ? "bg-liberia-blue text-white" : "bg-white text-liberia-blue"} border border-liberia-blue`}
            style={{ outline: isListening ? "2px solid #2563eb" : "none" }}
          >
            <Mic className="w-5 h-5" />
          </button>
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-liberia-red text-white rounded-full px-4 py-2"
          >
            {loading ? (
              <span className="flex gap-1 ml-2">
                <span className="w-1 h-1 bg-liberia-blue rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1 h-1 bg-liberia-blue rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1 h-1 bg-liberia-blue rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
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
