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

const FAQ_ANSWERS: { question: string | RegExp; answer: string }[] = [
  {
    question: /how (do|can) i report an emergency/i,
    answer: "To report an emergency, tap the emergency type (Police, Fire, Medical, Disaster) on the home screen. Then, fill in the details, attach a photo or video if possible, and submit your report. Our team will respond as quickly as possible.",
  },
  {
    question: /what is alert liberia/i,
    answer: "Alert Liberia is a modern emergency response app designed to help you quickly connect with the nearest emergency teams, report incidents, and receive safety guidance. Your safety is our priority.",
  },
  {
    question: /how (do|can) i attach (a )?(photo|video)/i,
    answer: "When filling out the emergency report form, tap the 'Add Photo/Video' button. You can then select a photo or video from your device to help responders better understand your situation.",
  },
  {
    question: /what should i do if (someone|i) (is|am) (injured|hurt)/i,
    answer: "If someone is injured, call emergency services immediately (4455). If safe, provide first aid: stop any bleeding with clean cloth, keep the person calm and still, and do not move them unless absolutely necessary. Wait for professional help.",
  },
  {
    question: /how (do|can) i enable location/i,
    answer: "When prompted, tap 'Allow' to enable location. You can also enable location in your device settings for this app. Accurate location helps us send help to you faster.",
  },
  {
    question: /how do i use the ai chat/i,
    answer: "Type your question or describe your emergency in the chat box. The AI can provide safety tips, first aid instructions, and answer questions about using the app.",
  },
  {
    question: /what number do i call for emergencies/i,
    answer: "For emergencies in Liberia, call 4455. You can also use this app to report emergencies and get help.",
  },
  {
    question: /how do i see my reports/i,
    answer: "Tap the 'My Reports' section in the app menu to view all your submitted emergency reports and their status.",
  },
  {
    question: /how do i contact the police/i,
    answer: "You can contact the police by selecting 'Police' on the home screen and submitting a report, or by calling 4455 for immediate assistance.",
  },
  {
    question: /how do i contact the fire department/i,
    answer: "Select 'Fire' on the home screen to report a fire emergency, or call 4455. Provide your location and details for a faster response.",
  },
  {
    question: /how do i contact medical help|ambulance/i,
    answer: "For medical emergencies, select 'Medical' on the home screen or call 4455. If possible, provide details about the injury or illness.",
  },
  {
    question: /how do i get disaster updates/i,
    answer: "Check the 'News' section in the app for the latest disaster updates, safety tips, and official alerts.",
  },
  {
    question: /how do i change my language/i,
    answer: "Currently, the app is in English. Future updates may include support for more languages. Let us know if you need help in your local language.",
  },
  {
    question: /is my information private|secure/i,
    answer: "Yes, your information is kept private and secure. We only use your data to provide emergency assistance and do not share it without your consent.",
  },
  {
    question: /can i use this app offline/i,
    answer: "Some features may work offline, but reporting emergencies and getting real-time help requires an internet connection.",
  },
  {
    question: /what should i do during a fire/i,
    answer: "If there's a fire, leave the building immediately if safe. Stay low to avoid smoke, use stairs (not elevators), and call 4455 or report via the app. Do not re-enter the building until it's declared safe.",
  },
  {
    question: /what should i do during a flood/i,
    answer: "Move to higher ground immediately. Avoid walking or driving through flood waters. Stay informed via the app's news section and follow official instructions.",
  },
  {
    question: /how do i update the app/i,
    answer: "If you installed from the app store, check for updates there. If using the web version, refresh your browser to get the latest features.",
  },
  {
    question: /how do i reset my password/i,
    answer: "Currently, the app does not require a password. Your device is your key. If you have issues, contact support.",
  },
  {
    question: /what should i do if i feel unsafe/i,
    answer: "If you feel unsafe, move to a safe location if possible and contact emergency services immediately. You can also use this app to report your situation.",
  },
  {
    question: /can i report anonymously/i,
    answer: "Yes, you can submit reports without entering your name. However, providing contact information can help responders reach you faster.",
  },
  {
    question: /how do i share my location/i,
    answer: "When prompted, tap 'Allow' to share your location. This helps emergency teams find you quickly.",
  },
  {
    question: /how do i cancel a report/i,
    answer: "If you need to cancel a report, please contact emergency services directly or use the chat to explain your situation.",
  },
  {
    question: /what should i do if the app is not working/i,
    answer: "Try closing and reopening the app, or refreshing your browser. If the problem continues, contact support for help.",
  },
  {
    question: /how do i get first aid tips/i,
    answer: "Ask me about any first aid situation (e.g., 'How do I treat a burn?'), and I'll provide step-by-step instructions.",
  },
  {
    question: /can i use this app for someone else/i,
    answer: "Yes, you can report emergencies for others. Please provide as much detail as possible to help responders.",
  },
  {
    question: /how do i know help is coming/i,
    answer: "After submitting a report, you'll see it in 'My Reports'. Our team will contact you if more information is needed.",
  },
  {
    question: /how do i attach my location to a report/i,
    answer: "When submitting a report, your location is automatically included if you have enabled location services.",
  },
  {
    question: /how do i get safety tips/i,
    answer: "You can ask me for safety tips about any emergency, or check the 'News' section for official advice.",
  },
  // Add more as needed!
];

// Helper to check for FAQ match
function getFAQAnswer(input: string): string | null {
  for (const { question, answer } of FAQ_ANSWERS) {
    if (
      typeof question === "string"
        ? input.toLowerCase().includes(question.toLowerCase())
        : question.test(input)
    ) {
      return answer;
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

    // --- FAQ/Help Layer ---
    const faqAnswer = getFAQAnswer(input);
    if (faqAnswer) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: faqAnswer }
      ]);
      setLoading(false);
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
