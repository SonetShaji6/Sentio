export class PromptManager {
  // ── GENERATION SCHEMAS ──

  static readonly QUIZ_SCHEMA = `
  Return a JSON array of quiz slide objects. Each object must exactly match this structure:
  [
    {
      "type": "quiz",
      "title": "The question text",
      "description": "Optional brief context or explanation",
      "config": {
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswers": [0], // Array with 0-based integer index of correct option
        "timer": 30, // Time limit in seconds (10, 20, 30, 45, 60)
        "points": 1000 // Points (500, 1000, 2000)
      }
    }
  ]
  `;

  static readonly POLL_SCHEMA = `
  Return a JSON array of poll slide objects. Each object must exactly match this structure:
  [
    {
      "type": "poll",
      "title": "The poll question",
      "description": "Optional context",
      "config": {
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "allowMultiple": false
      }
    }
  ]
  `;

  static readonly FULL_DECK_SCHEMA = `
  Return a JSON array of slide objects representing a cohesive, complete presentation deck.
  Supported types: "title", "information", "poll", "wordcloud", "quiz", "opentext", "thankyou".
  Example:
  [
    {
      "type": "title",
      "title": "Presentation Title",
      "description": "Subtitle or summary",
      "config": { "kicker": "Keynote", "author": "Presenter" }
    },
    {
      "type": "information",
      "title": "Key Insights / Overview",
      "description": "Detailed description",
      "config": { "bulletPoints": ["Key point 1", "Key point 2", "Key point 3"] }
    },
    {
      "type": "poll",
      "title": "Audience Question",
      "description": "Vote now",
      "config": { "options": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"], "allowMultiple": false }
    },
    {
      "type": "quiz",
      "title": "Knowledge Check",
      "description": "Test what was learned",
      "config": { "options": ["A", "B", "C", "D"], "correctAnswers": [0], "timer": 30, "points": 1000 }
    },
    {
      "type": "thankyou",
      "title": "Thank You!",
      "description": "Q&A & Discussion",
      "config": { "callToAction": "sentio.app" }
    }
  ]
  `;

  static readonly ICEBREAKER_SCHEMA = `
  Return a JSON array of interactive icebreaker / engagement slides ("wordcloud", "opentext", "rating", "poll").
  Example:
  [
    {
      "type": "wordcloud",
      "title": "In one word, what comes to mind when you hear this topic?",
      "description": "Submit keywords on your mobile device"
    },
    {
      "type": "opentext",
      "title": "What is the biggest question you hope to answer today?",
      "description": "Share your thoughts live",
      "config": { "charLimit": 500 }
    },
    {
      "type": "rating",
      "title": "How familiar are you with this topic?",
      "description": "Rate your baseline knowledge",
      "config": { "ratingRange": { "min": 1, "max": 5 }, "lowLabel": "Beginner", "highLabel": "Expert" }
    }
  ]
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
    return `Generate exactly ${count} multiple-choice quiz questions about "${topic}" at a ${difficulty} difficulty level.
    Make each question distinct, educational, and engaging.
    For each question, provide 4 plausible options and specify the index of the correct answer in correctAnswers array.
    ${context ? `Use the following context to inform the questions:\n${context}` : ""}`;
  }

  static getPollPrompt(
    topic: string,
    count: number,
    audience?: string,
  ): string {
    return `Generate exactly ${count} interactive poll questions to engage an audience regarding the topic "${topic}".
    ${audience ? `The target audience is: ${audience}.` : ""}
    Ensure questions promote diverse perspectives and active discussion with 3 to 5 clear options.`;
  }

  static getFullDeckPrompt(
    topic: string,
    count: number = 5,
    tone: string = "engaging",
    audience?: string,
    context?: string,
  ): string {
    return `Generate a cohesive, complete presentation deck of approximately ${count} slides on the topic "${topic}".
    The presentation tone should be ${tone}.
    ${audience ? `The audience is: ${audience}.` : ""}
    ${context ? `Additional background context: ${context}` : ""}
    
    Structure the deck logically:
    1. A Title slide introducing the topic.
    2. 1-2 Information slides detailing key insights with 3-4 bullet points each.
    3. 1-2 Interactive slides (such as a Poll, Quiz question, or Word Cloud) to engage participants.
    4. A Thank You / Conclusion slide.`;
  }

  static getIcebreakerPrompt(
    topic: string,
    count: number = 3,
    audience?: string,
  ): string {
    return `Generate ${count} fun, highly engaging audience icebreaker and warmup interaction slides (using wordcloud, opentext, or rating) related to "${topic}".
    ${audience ? `Target audience: ${audience}` : ""}
    These slides should get participants relaxed, voting, and typing responses right away.`;
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
    return `You are Sentio AI, an expert presentation design and engagement assistant helping a user build, structure, and refine their slide deck.
    You have access to the current presentation context:
    ${presentationContext}
    
    Provide concise, actionable, and inspiring advice on structuring slides, crafting interactive polls, optimizing question wording, or timing presentations.`;
  }
}
