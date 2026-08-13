import crypto from "crypto";
// @ts-ignore
import LRU from "lru-cache";
import { IAIProvider } from "./providers/AIProvider";
import { GroqProvider } from "./providers/GroqProvider";
import { PromptManager } from "./PromptManager";

class AIService {
  private provider: IAIProvider;

  // Cache to prevent duplicate AI generations (100 items, 1-hour TTL)
  private cache = new LRU<string, any>({
    max: 100,
    maxAge: 1000 * 60 * 60,
  });

  constructor() {
    // Easily swappable to OpenAIProvider or GeminiProvider in the future
    this.provider = new GroqProvider();
  }

  private async logAI(
    endpoint: string,
    usage: any,
    startTime: number,
    status: "success" | "error" = "success",
  ) {
    try {
      const AILog = (await import("../models/AILog")).default;
      await AILog.create({
        endpoint,
        modelName: "llama-3.3-70b-versatile",
        promptTokens: usage?.promptTokens || 0,
        completionTokens: usage?.completionTokens || 0,
        totalTokens: usage?.totalTokens || 0,
        latencyMs: Date.now() - startTime,
        status,
      });
    } catch (err) {
      console.warn("Failed to save AI log:", err);
    }
  }

  private getCacheKey(method: string, prompt: string): string {
    return crypto
      .createHash("sha256")
      .update(`${method}:${prompt}`)
      .digest("hex");
  }

  /**
   * Generates a set of multiple-choice quiz questions.
   */
  async generateQuiz(
    topic: string,
    count: number,
    difficulty: string,
    context?: string,
  ) {
    const prompt = PromptManager.getQuizPrompt(
      topic,
      count,
      difficulty,
      context,
    );
    const cacheKey = this.getCacheKey("quiz", prompt);

    if (this.cache.has(cacheKey)) {
      console.log("[AIService] Cache hit for generateQuiz");
      return this.cache.get(cacheKey);
    }

    const response = await this.provider.generateStructured<any[]>(
      prompt,
      PromptManager.QUIZ_SCHEMA,
      "You are an expert curriculum designer. Generate accurate, engaging quiz questions.",
    );

    this.cache.set(cacheKey, response.content);
    return response.content;
  }

  /**
   * Generates a set of poll questions.
   */
  async generatePoll(topic: string, count: number, audience?: string) {
    const prompt = PromptManager.getPollPrompt(topic, count, audience);
    const cacheKey = this.getCacheKey("poll", prompt);

    if (this.cache.has(cacheKey)) {
      console.log("[AIService] Cache hit for generatePoll");
      return this.cache.get(cacheKey);
    }

    const response = await this.provider.generateStructured<any[]>(
      prompt,
      PromptManager.POLL_SCHEMA,
      "You are an expert audience engagement specialist. Generate thought-provoking poll questions.",
    );

    this.cache.set(cacheKey, response.content);
    return response.content;
  }

  /**
   * Summarizes a presentation based on text content.
   */
  async summarizePresentation(title: string, textContent: string) {
    const prompt = PromptManager.getSummarizationPrompt(title, textContent);
    const cacheKey = this.getCacheKey("summarize", prompt);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await this.provider.generateText(prompt);
    this.cache.set(cacheKey, response.content);
    return response.content;
  }

  /**
   * Analyzes live session data to provide real-time recommendations (Module 11).
   */
  async analyzeEngagement(
    sessionOverview: any,
    quizMetrics: any,
    timeline: any[],
  ) {
    const prompt = PromptManager.getInsightPrompt(
      sessionOverview,
      quizMetrics,
      timeline,
    );

    // We do NOT cache this aggressively because session data changes minute-by-minute
    // We rely on the recommendationService to throttle calls.
    const response = await this.provider.generateStructured<any>(
      prompt,
      PromptManager.RECOMMENDATION_SCHEMA,
      "You are an expert AI presentation coach.",
    );

    return response.content;
  }

  /**
   * Free-form chat for the AI Assistant.
   */
  async chat(message: string, context: string) {
    const systemPrompt = PromptManager.getChatSystemPrompt(context);
    const response = await this.provider.generateText(message, systemPrompt);
    return response.content;
  }
}

export const aiService = new AIService();
