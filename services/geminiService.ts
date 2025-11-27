import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RiddleData, Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction from the user prompt
const RIDDLE_MAKER_INSTRUCTION = `
You are an AI that generates short, safe, visually-clear image riddles based on the context of real news articles or topics.

Your role:
- Read the incoming news content/topic.
- Create a themed image riddle related to the topic.
- The riddle must NOT reveal the answer directly inside the image description (the image should be a clue, not the answer text).
- Keep the riddle family-friendly and globally understandable.

For the input topic, generate:
1) image_prompt: A detailed visual description for text-to-image generation (NO text inside image). The image must reflect the theme.
2) riddle_question: A clever, short riddle inspired by the news topic.
3) choices: 4 variants.
4) answerIndex: 0–3.
5) hints: 2 subtle clues.
6) fun_fact: Interesting fact related to the topic.
`;

const riddleResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    image_prompt: { type: Type.STRING },
    riddle_question: { type: Type.STRING },
    choices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    answerIndex: { type: Type.INTEGER },
    hints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    fun_fact: { type: Type.STRING },
  },
  required: ["image_prompt", "riddle_question", "choices", "answerIndex", "hints", "fun_fact"],
};

export const fetchTrendingNews = async (category?: string): Promise<string> => {
  try {
    const categoryPrompt = category ? ` specifically related to the category "${category}"` : "";
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find a trending, interesting, family-friendly news headline from today or this week${categoryPrompt}. Return only the headline and a 1-sentence summary.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Check for grounding chunks to verify search worked, though we just need the text
    const text = response.text;
    if (!text) throw new Error("Failed to find trending news.");
    return text;
  } catch (error) {
    console.error("Error fetching news:", error);
    throw new Error("Could not fetch trending news. Please try a manual topic.");
  }
};

export const generateRiddleFromTopic = async (topic: string, difficulty: Difficulty): Promise<RiddleData> => {
  try {
    const difficultyInstruction = {
      easy: "Target Audience: Kids/Beginners. The riddle should be simple, direct, and use easy vocabulary. The image_prompt should act as a literal, very helpful visual clue.",
      medium: "Target Audience: General Public. The riddle should use standard wordplay and cleverness. The image_prompt should be thematic and offer a clear but not obvious clue.",
      hard: "Target Audience: Puzzle Experts. The riddle should be abstract, cryptic, or use complex lateral thinking. The image_prompt should be subtle, artistic, symbolic, or tangential—making the user think deeply to find the connection."
    }[difficulty];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a riddle based on this topic: ${topic}. \n\nConstraint: ${difficultyInstruction}`,
      config: {
        systemInstruction: RIDDLE_MAKER_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: riddleResponseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini.");
    
    const data = JSON.parse(text) as RiddleData;
    // Inject the topic back into the data for reference
    data.news_topic = topic; 
    data.difficulty = difficulty;
    return data;
  } catch (error) {
    console.error("Error generating riddle text:", error);
    throw new Error("Failed to generate riddle logic.");
  }
};

export const generateRiddleImage = async (prompt: string): Promise<string> => {
  try {
    // Using gemini-2.5-flash-image for standard generation
    // We could upgrade to 'gemini-3-pro-image-preview' if higher quality is needed,
    // but Flash Image is fast and efficient for this game loop.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        // No responseMimeType for image generation models in this mode
      }
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Data = part.inlineData.data;
          // Assuming PNG as it's common, but the API usually returns JPEG or PNG. 
          // The mimeType field in inlineData should be used.
          const mimeType = part.inlineData.mimeType || "image/png";
          return `data:${mimeType};base64,${base64Data}`;
        }
      }
    }
    
    throw new Error("No image data found in response.");
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate the riddle image.");
  }
};