import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const LANG_NAMES: Record<string, string> = { en: "English", te: "Telugu", hi: "Hindi" };

export async function translateWithAI(text: string, lang: string) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("Translation is not configured.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system: `Translate the user's short personal-finance transaction description into ${LANG_NAMES[lang] ?? "English"}. Keep brand names, numbers and amounts unchanged. Reply with only the translation, nothing else.`,
    messages: [{ role: "user", content: text }],
    providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
  });
  const out = (await result.text).trim();
  if (!out) throw new Error("The translation came back empty.");
  return out;
}
