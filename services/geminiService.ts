import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';
import { Trip, Destination, GeminiFeature } from "../types";

// Access Vite environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let geminiInstance: GoogleGenAI | null = null;
let geminiInitializationError: string | null = null;

if (!API_KEY) {
  geminiInitializationError = "VITE_API_KEY is not defined. AI features will be disabled.";
  console.warn(geminiInitializationError);
} else {
  try {
    geminiInstance = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error: any) {
    geminiInitializationError = `Failed to initialize GoogleGenAI SDK. ${error.message || "Unknown error"}`;
    console.error(geminiInitializationError, error);
    geminiInstance = null;
  }
}

export const ai = geminiInstance;

/**
 * Returns a string describing why AI initialization failed, or null if successful.
 */
export const getAiInitializationError = (): string | null => geminiInitializationError;

export const generateText = async (prompt: string): Promise<string> => {
  if (!ai) {
    return getAiInitializationError() || "AI service not initialized.";
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text from Gemini:", error);
    return "Sorry, I couldn't generate a response. Please try again.";
  }
};

export const getGeminiSuggestionForTrip = async (
  feature: GeminiFeature,
  trip: Trip,
  destination?: Destination
): Promise<string> => {
  if (!ai) {
    return getAiInitializationError() || "AI service not initialized.";
  }

  let promptText = "";
  const locationContext = destination?.name || (trip.destinations.length > 0 ? trip.destinations[0].name : trip.name);

  switch (feature) {
    case GeminiFeature.SUGGEST_ACTIVITIES:
      if (!destination) return "Please select a destination to suggest activities for.";
      promptText = `Suggest 5 unique and interesting activities for a trip to ${destination.name}. Consider a variety of interests. The trip is from ${trip.startDate} to ${trip.endDate}. Format as a numbered list.`;
      break;

    case GeminiFeature.GENERATE_PACKING_LIST:
      const destinationsString = trip.destinations.map(d => d.name).join(', ');
      promptText = `Generate a comprehensive packing list for a trip to ${destinationsString || trip.name} from ${trip.startDate} to ${trip.endDate}. Include categories like Clothing, Toiletries, Documents, Electronics, and Miscellaneous. Be specific.`;
      break;

    case GeminiFeature.TRAVEL_TIPS:
      promptText = `Provide 5 essential travel tips for visiting ${locationContext}. Focus on safety, local customs, and making the most of the trip. Format as a bulleted list.`;
      break;

    case GeminiFeature.CHAT_FAMOUS_SPOTS:
      return "Chat feature is handled by the dedicated chat interface.";

    default:
      return "Invalid feature selected or feature not supported.";
  }

  return generateText(promptText);
};
