import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function chatWithGemini(messages: ChatMessage[]) {
  if (!apiKey) throw new Error("API key missing");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction: "You are Finance UMKM Assistant, a specialist in small business financial management. Provide advice on cash flow, tax, and profit optimization. Use Indonesian (Bahasa Indonesia) as the primary language. Be professional, supportive, and data-driven.",
    }
  });

  return response.text || "I'm sorry, I couldn't generate a response.";
}

export async function generateNoteTitle(content: string) {
  if (!apiKey) return "Untitled Note";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a short (3-5 words) title for this note: "${content}"`,
    config: {
      systemInstruction: "Return only the title text, nothing else.",
    }
  });

  return response.text?.trim() || "Untitled Note";
}
