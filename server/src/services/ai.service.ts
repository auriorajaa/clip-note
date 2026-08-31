import {
  type GenerateContentRequest,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import { AppError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes";
import logger from "../utils/logger.js";

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  sentiment: "positive" | "negative" | "neutral";
  topics: string[];
  suggestedTags: string[];
}

export class AIService {
  private static readonly genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_API_KEY!,
  );
  private static readonly model = AIService.genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
  });

  private static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 2000,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        logger.warn(
          `AI analysis attempt ${attempt}/${maxAttempts} failed: ${error}`,
        );

        if (attempt < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayMs * attempt),
          );
        }
      }
    }

    throw lastError;
  }

  private static generatePrompt(transcription: string, videoInfo?: any) {
    let prompt = `You are a video content analyzer. your task is to analyze the provided video transcription and return a JSON response.

    IMPORTANT: Your response must be valid JSON and match this exact structure:
    {
      "summary": "2-3 sentences summarizing the main content",
      "keyPoints": ["point 1", "point 2", "etc"],
      "sentiment": "positive|negative|neutral",
      "topics": ["topic1", "topic2", "etc"],
      "suggestedTags": ["#tag1", "#tag2", "etc"]
    }

    DO NOT include any text outside the JSON structure. Your response should be parseable by json.parse().

    Analyze this transcription:
    """
    ${transcription}
    """`;

    if (videoInfo) {
      prompt += `\n\nAdditional video context:
      Title: "${videoInfo.title}",
      Author: "${videoInfo.author}",
      Duration: ${videoInfo.duration} seconds`;
    }

    return prompt;
  }

  static async analyzeTranscription(
    transcription: string,
    videoInfo?: any,
  ): Promise<AIAnalysis> {
    const prompt = AIService.generatePrompt(transcription, videoInfo);

    const generateConfig: GenerateContentRequest = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        // @ts-expect-error
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    };

    const result = await this.retryWithBackoff(() =>
      this.model.generateContent(generateConfig),
    );
    const response = result.response;
    const text = response.text();

    logger.info(`[DEBUG] Raw AI response: ${text}`);

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;

      const analysis = JSON.parse(jsonStr) as AIAnalysis;

      if (
        !analysis.summary ||
        !Array.isArray(analysis.keyPoints) ||
        !analysis.sentiment
      ) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid response format");
      }

      if (!["positive", "negative", "neutral"].includes(analysis.sentiment)) {
        analysis.sentiment = "neutral";
      }

      return {
        summary: analysis.summary,
        keyPoints: analysis.keyPoints || [],
        sentiment: analysis.sentiment as "positive" | "negative" | "neutral",
        topics: analysis.topics || [],
        suggestedTags: analysis.suggestedTags || [],
      };
    } catch (error) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid response format");
    }
  }
}
