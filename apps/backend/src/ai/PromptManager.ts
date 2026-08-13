export class PromptManager {
  // ── GENERATION SCHEMAS ──

  static readonly QUIZ_SCHEMA = `
  Return a JSON array of quiz slide objects. Each object must exactly match this structure:
  {
    "type": "quiz",
    "title": "The question text",
    "description": "Optional subtitle or context",
    "config": {
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctOptionIndex": 0, // Integer index (0-based) of the correct answer
      "timer": 30, // Time limit in seconds
      "points": 1000 // Default points
    }
  }
  `;

  static readonly POLL_SCHEMA = `
  Return a JSON array of poll slide objects. Each object must exactly match this structure:
  {
    "type": "poll",
    "title": "The poll question",
    "description": "Optional subtitle",
    "config": {
      "options": ["Option A", "Option B", "Option C"],
      "allowMultiple": false
    }
  }
  `;

  static readonly KEYWORDS_SCHEMA = `
  Return a JSON object with a "keywords" array containing the most relevant terms:
  {
    "keywords": [
      {
        "term": "string",
        "relevance": 0.95 // Float between 0 and 1
      }
    ]
  }
  `;

  static readonly RECOMMENDATION_SCHEMA = `
  Return a JSON object matching this structure:
  {
    "sentiment": "Positive" | "Neutral" | "Negative" | "Confused" | "Curious" | "Frustrated" | "Highly Engaged",
    "topicDetection": ["Trending Topic 1", "Knowledge Gap 2"],
    "recommendations": [
      {
        "recommendation": "Short directive (e.g. 'Slow down')",
        "reason": "Why this is recommended",
        "evidence": "What data led to this",
        "confidence": 0.8 // Float between 0 and 1
      }
    ]
  }
  `;

  // ── SYSTEM PROMPTS ──

  static getQuizPrompt(
    topic: string,
    count: number,
    difficulty: string = "medium",
    context?: string,
  ): string {
    return `Generate ${count} multiple-choice quiz questions about "${topic}" at a ${difficulty} difficulty level. 
    ${context ? `Use the following context to inform the questions: ${context}` : ""}`;
  }

  static getPollPrompt(
    topic: string,
    count: number,
    audience?: string,
  ): string {
    return `Generate ${count} interactive poll questions to engage an audience regarding the topic "${topic}".
    ${audience ? `The target audience is: ${audience}.` : ""}
    Ensure the questions promote diverse opinions and engagement.`;
  }

  static getSummarizationPrompt(
    presentationTitle: string,
    slideTextContent: string,
  ): string {
    return `You are an expert summarizer. Provide a concise but comprehensive summary of the following presentation titled "${presentationTitle}".
    
    Content:
    ${slideTextContent}
    
    Focus on the main themes, key takeaways, and structural flow of the presentation. Do not include JSON formatting, just plain text.`;
  }

  static getInsightPrompt(
    sessionOverview: any,
    quizMetrics: any,
    timeline: any[],
  ): string {
    return `You are an expert AI presentation coach analyzing a live session.
    
    Session Data:
    ${JSON.stringify(sessionOverview)}
    
    Quiz Metrics:
    ${JSON.stringify(quizMetrics)}
    
    Timeline Events (last 10 mins):
    ${JSON.stringify(timeline)}
    
    Analyze the audience's engagement, performance, and behavior. Provide your interpretation, detect sentiment, and give actionable recommendations for the presenter right now.`;
  }

  static getChatSystemPrompt(presentationContext: string): string {
    return `You are Sentio AI, an expert presentation assistant helping a user build and refine their slide deck.
    You have access to the current presentation context:
    ${presentationContext}
    
    Provide concise, actionable advice on improving engagement, structuring slides, or adding interactions.`;
  }
}
