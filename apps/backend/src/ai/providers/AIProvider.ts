export interface AIResponse<T = any> {
  content: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface IAIProvider {
  /**
   * Generates free-form text based on the provided prompt and system instructions.
   */
  generateText(
    prompt: string,
    systemPrompt?: string,
  ): Promise<AIResponse<string>>;

  /**
   * Generates structured data (JSON) based on the provided prompt, system instructions, and schema.
   */
  generateStructured<T>(
    prompt: string,
    schemaDescription: string,
    systemPrompt?: string,
  ): Promise<AIResponse<T>>;
}
