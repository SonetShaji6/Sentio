import Groq from "groq-sdk";
import { IAIProvider, AIResponse } from "./AIProvider";

export class GroqProvider implements IAIProvider {
  private getClient(): Groq {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("[GroqProvider] GROQ_API_KEY is missing from process.env");
    }
    return new Groq({ apiKey: apiKey || "dummy_key_to_prevent_startup_crash" });
  }

  private get defaultModel(): string {
    return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
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

    try {
      const completion = await client.chat.completions.create({
        messages,
        model: this.defaultModel,
        temperature: 0.7,
      });

      return {
        content: completion.choices[0]?.message?.content || "",
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        model: this.defaultModel,
      };
    } catch (error) {
      console.error("[GroqProvider] Error generating text:", error);
      throw new Error("Failed to generate text from Groq.");
    }
  }

  async generateStructured<T>(
    prompt: string,
    schemaDescription: string,
    systemPrompt?: string,
  ): Promise<AIResponse<T>> {
    const messages: any[] = [];

    const combinedSystemPrompt = `
      ${systemPrompt || "You are a helpful AI assistant."}
      You MUST respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
      ${schemaDescription}
    `.trim();

    messages.push({ role: "system", content: combinedSystemPrompt });
    messages.push({ role: "user", content: prompt });

    const client = this.getClient();

    try {
      const completion = await client.chat.completions.create({
        messages,
        model: this.defaultModel,
        temperature: 0.1, // Lower temperature for more deterministic JSON
        response_format: { type: "json_object" }, // Force JSON mode
      });

      const rawContent = completion.choices[0]?.message?.content || "{}";

      let parsedContent: T;
      try {
        parsedContent = JSON.parse(rawContent) as T;
      } catch (parseError) {
        console.error(
          "[GroqProvider] Failed to parse JSON response:",
          rawContent,
        );
        throw new Error("AI provider returned invalid JSON.");
      }

      return {
        content: parsedContent,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        model: this.defaultModel,
      };
    } catch (error) {
      console.error(
        "[GroqProvider] Error generating structured output:",
        error,
      );
      throw new Error("Failed to generate structured data from Groq.");
    }
  }
}
