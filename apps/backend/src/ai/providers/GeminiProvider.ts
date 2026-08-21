import { GoogleGenAI } from "@google/genai";
import { IAIProvider, AIResponse } from "./AIProvider";

export class GeminiProvider implements IAIProvider {
  private getClient(): GoogleGenAI {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "[GeminiProvider] GEMINI_API_KEY is missing from environment variables.",
      );
    }

    return new GoogleGenAI({ apiKey });
  }

  private getModel(): string {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  }

  private cleanResponse(text: string): string {
    let cleaned = text.trim();
    // Strip reasoning blocks if any
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    // Strip markdown code fences (e.g. ```json ... ``` or ``` ...)
    if (cleaned.startsWith("```")) {
      cleaned = cleaned
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    }
    return cleaned;
  }

  async generateText(
    prompt: string,
    systemPrompt?: string,
  ): Promise<AIResponse<string>> {
    const ai = this.getClient();
    const model = this.getModel();

    const contents: any[] = [];
    if (systemPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: `SYSTEM INSTRUCTION:\n${systemPrompt}` }],
      });
      contents.push({
        role: "model",
        parts: [{ text: "Understood. I will follow these instructions." }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    const response = await ai.models.generateContent({
      model,
      contents,
    });

    const rawText = response.text || "";
    const content = this.cleanResponse(rawText);

    return {
      content,
      usage: {
        promptTokens: (response as any).usageMetadata?.promptTokenCount || 0,
        completionTokens:
          (response as any).usageMetadata?.candidatesTokenCount || 0,
        totalTokens: (response as any).usageMetadata?.totalTokenCount || 0,
      },
      model,
    };
  }

  async generateStructured<T>(
    prompt: string,
    schemaDescription: string,
    systemPrompt?: string,
  ): Promise<AIResponse<T>> {
    const ai = this.getClient();
    const model = this.getModel();

    const instruction = `
${systemPrompt || "You are an expert AI presentation and curriculum specialist."}
You MUST respond with VALID JSON ONLY that adheres to the following specification:
${schemaDescription}
Do NOT include markdown formatting, code block wrappers (\`\`\`json), or any conversational commentary outside the JSON.
`.trim();

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `${instruction}\n\nUSER REQUEST:\n${prompt}` }],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    const cleaned = this.cleanResponse(rawText);

    let parsedContent: T;
    try {
      parsedContent = JSON.parse(cleaned) as T;
    } catch (parseError) {
      console.error(
        `[GeminiProvider] Failed to parse JSON with model '${model}':`,
        cleaned,
      );
      throw new Error("Failed to parse structured JSON response from Gemini.");
    }

    return {
      content: parsedContent,
      usage: {
        promptTokens: (response as any).usageMetadata?.promptTokenCount || 0,
        completionTokens:
          (response as any).usageMetadata?.candidatesTokenCount || 0,
        totalTokens: (response as any).usageMetadata?.totalTokenCount || 0,
      },
      model,
    };
  }
}
