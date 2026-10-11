import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const translateDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ text: z.string().trim().min(1).max(500), lang: z.enum(["en", "te", "hi"]) }).parse(d))
  .handler(async ({ data }) => {
    const { translateWithAI } = await import("./translate.server");
    try {
      return { text: await translateWithAI(data.text, data.lang) };
    } catch (e) {
      const msg = (e as { statusCode?: number }).statusCode === 402 ? "AI credits have run out." : (e as Error).message || "Translation failed.";
      return { error: msg };
    }
  });
