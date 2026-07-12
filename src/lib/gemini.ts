import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set.");
}

export const genAI = new GoogleGenerativeAI(apiKey);

/**
 * 지정된 모델 이름으로 Gemini Generative Model 인스턴스를 반환합니다.
 * @param modelName 모델 명칭 (기본값: gemini-3.1-flash-lite)
 */
export const getGeminiModel = (modelName: string = "gemini-3.1-flash-lite") => {
  return genAI.getGenerativeModel({ model: modelName });
};
