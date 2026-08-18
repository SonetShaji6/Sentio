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
    this.provider = new GroqProvider();
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
    difficulty: string = "medium",
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
   * Generates a complete structured presentation deck.
   */
  async generateFullDeck(
    topic: string,
    count: number = 5,
    tone: string = "engaging",
    audience?: string,
    context?: string,
  ) {
    const prompt = PromptManager.getFullDeckPrompt(
      topic,
      count,
      tone,
      audience,
      context,
    );
    const cacheKey = this.getCacheKey("full_deck", prompt);

    if (this.cache.has(cacheKey)) {
      console.log("[AIService] Cache hit for generateFullDeck");
      return this.cache.get(cacheKey);
    }

    const response = await this.provider.generateStructured<any[]>(
      prompt,
      PromptManager.FULL_DECK_SCHEMA,
      "You are a world-class presentation strategist and keynote designer.",
    );

    this.cache.set(cacheKey, response.content);
    return response.content;
  }

  /**
   * Generates icebreaker & audience warmup slides.
   */
  async generateIcebreakers(
    topic: string,
    count: number = 3,
    audience?: string,
  ) {
    const prompt = PromptManager.getIcebreakerPrompt(topic, count, audience);
    const cacheKey = this.getCacheKey("icebreakers", prompt);

    if (this.cache.has(cacheKey)) {
      console.log("[AIService] Cache hit for generateIcebreakers");
      return this.cache.get(cacheKey);
    }

    const response = await this.provider.generateStructured<any[]>(
      prompt,
      PromptManager.ICEBREAKER_SCHEMA,
      "You are an expert facilitator creating engaging audience icebreakers.",
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
   * Analyzes live session data to provide real-time recommendations.
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
