import Groq from "groq-sdk";
import { IAIProvider, AIResponse } from "./AIProvider";

const FALLBACK_MODELS = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
].filter(Boolean) as string[];

export class GroqProvider implements IAIProvider {
  private getClient(): Groq {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("[GroqProvider] GROQ_API_KEY is missing from process.env");
    }
    return new Groq({ apiKey: apiKey || "dummy_key_to_prevent_startup_crash" });
  }

  private cleanResponse(text: string): string {
    let cleaned = text.trim();
    // Strip <think>...</think> reasoning blocks if present
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    // Strip markdown code fences if present (e.g. ```json ... ```)
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
    const client = this.getClient();
    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    let lastError: any = null;

    // Try models in fallback order
    for (const model of FALLBACK_MODELS) {
      try {
        const completion = await client.chat.completions.create({
          messages,
          model,
          temperature: 0.7,
        });

        const rawContent = completion.choices[0]?.message?.content || "";
        const content = this.cleanResponse(rawContent);

        return {
          content,
          usage: {
            promptTokens: completion.usage?.prompt_tokens || 0,
            completionTokens: completion.usage?.completion_tokens || 0,
            totalTokens: completion.usage?.total_tokens || 0,
          },
          model,
        };
      } catch (error: any) {
        lastError = error;
        // If model not found (404), try next model in fallback list
        if (
          error?.status === 404 ||
          error?.message?.includes("model_not_found")
        ) {
          console.warn(
            `[GroqProvider] Model '${model}' not available, trying next fallback model...`,
          );
          continue;
        }
        console.error(`[GroqProvider] Error with model '${model}':`, error);
        break;
      }
    }

    console.error("[GroqProvider] All fallback models failed:", lastError);
    throw new Error(lastError?.message || "Failed to generate text from Groq.");
  }

  async generateStructured<T>(
    prompt: string,
    schemaDescription: string,
    systemPrompt?: string,
  ): Promise<AIResponse<T>> {
    const messages: any[] = [];

    const combinedSystemPrompt = `
      ${systemPrompt || "You are a helpful AI assistant."}
      You MUST respond ONLY with valid JSON. Do not include markdown formatting or commentary.
      ${schemaDescription}
    `.trim();

    messages.push({ role: "system", content: combinedSystemPrompt });
    messages.push({ role: "user", content: prompt });

    const client = this.getClient();
    let lastError: any = null;

    for (const model of FALLBACK_MODELS) {
      try {
        const completion = await client.chat.completions.create({
          messages,
          model,
          temperature: 0.1,
          response_format: { type: "json_object" },
        });

        const rawContent = completion.choices[0]?.message?.content || "{}";
        const cleaned = this.cleanResponse(rawContent);

        let parsedContent: T;
        try {
          parsedContent = JSON.parse(cleaned) as T;
        } catch (parseError) {
          console.error(
            `[GroqProvider] Failed to parse JSON with model '${model}':`,
            cleaned,
          );
          continue;
        }

        return {
          content: parsedContent,
          usage: {
            promptTokens: completion.usage?.prompt_tokens || 0,
            completionTokens: completion.usage?.completion_tokens || 0,
            totalTokens: completion.usage?.total_tokens || 0,
          },
          model,
        };
      } catch (error: any) {
        lastError = error;
        if (
          error?.status === 404 ||
          error?.message?.includes("model_not_found")
        ) {
          console.warn(
            `[GroqProvider] Model '${model}' not available for JSON, trying next fallback...`,
          );
          continue;
        }
        console.error(`[GroqProvider] Error with model '${model}':`, error);
        break;
      }
    }

    console.error(
      "[GroqProvider] All fallback models failed for structured output:",
      lastError,
    );
    throw new Error(
      lastError?.message || "Failed to generate structured data from Groq.",
    );
  }
}
