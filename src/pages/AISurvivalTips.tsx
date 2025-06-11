import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { InferenceClient } from "@huggingface/inference";
import { useLocation, useNavigate } from "react-router-dom";

const client = new InferenceClient("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");

function cleanTips(text: string) {
  // Remove markdown formatting: *, **, ###, ##, #, and leading/trailing whitespace
  return text
    .replace(/[*#]+/g, "") // Remove all * and # characters
    .replace(/^\s+|\s+$/g, ""); // Trim whitespace
}

const AISurvivalTips: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { description, lat, lng, address, contact } = location.state || {};

  const [aiTips, setAiTips] = useState<string>("Loading AI tips...");
  const fetched = useRef(false);

  useEffect(() => {
    if (!description || !lat || !lng || fetched.current) return;
    fetched.current = true;
    const fetchTips = async () => {
      try {
        const prompt = `You are an emergency assistant. Based on the following emergency description and location, provide practical, actionable tips for the person to stay safe or help themselves while waiting for emergency responders. Be concise and clear and make it simple and should be all text and no format.

Emergency Description: ${description}
Location: ${address || ""} (lat: ${lat}, lng: ${lng})
This Contact: ${contact || "No contact information provided"} is my phone number.
Contact: ${contact}
give a more Liberian and formal response.
Liberia Emergency contact numbers: 4455.
Make it a bit short and concise.
Tell them to stay calm and help is already on the way.
Tips:`;

        const chatCompletion = await client.chatCompletion({
          provider: "auto",
          model: "deepseek-ai/DeepSeek-R1-0528",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const answer = chatCompletion.choices[0].message.content
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .replace(/<think>[\\s\\S]*?\\n/gi, "")
          .trim();

        setAiTips(answer || "No tips available.");
      } catch {
        setAiTips("Sorry, we could not generate AI tips at this time.");
      }
    };
    fetchTips();
  }, [description, lat, lng, address, contact]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-liberia-blue via-slate-900 to-liberia-blue relative">
      <div className="bg-white/10 border border-white/20 rounded p-4 mt-10 max-w-lg w-[90%] shadow-lg mb-32">
        <h3 className="text-lg font-semibold text-white mb-2 text-center">AI Survival Tips</h3>
        <p className="text-white/80 text-base md:text-lg whitespace-pre-line">{cleanTips(aiTips)}</p>
      </div>
      <div className="w-full flex justify-center fixed bottom-8 left-0 px-4">
        <Button
          onClick={() => navigate("/")}
          className="w-full max-w-lg bg-liberia-red hover:bg-liberia-red/90 text-white py-2 md:py-3 text-base md:text-lg font-semibold rounded-xl"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default AISurvivalTips;