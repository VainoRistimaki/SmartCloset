import "dotenv/config";
import OpenAI from "openai";
import { buildPrompt } from "./promptBuilder.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error(
    "Missing OpenAI credentials. Set OPENAI_API_KEY in your environment or .env file."
  );
}

const client = new OpenAI({ apiKey });

export async function getClothesRecommendation(userInput="What should I wear today?") {
  try {
    const prompt = await buildPrompt();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You respond ONLY with valid JSON. \
          Each cloth items are in { id: number, name: string } format. \
          Reply Several options. Clothes Recommendation Set 1, 2, 3, ...\n\
          Each set should contain sole set. Do not contain alternative option. \
          List at least 2 sets. \
          Consider thickness data to match weather condition. \
          After clothes recommendation, add explanation of the list." },
        { role: "developer", content: prompt },
        { role: "user", content: userInput }
      ],
      temperature: 0.4
    });

    const raw = response.choices[0].message.content.trim();
    const json = JSON.parse(raw);

    return json; // ??[{ id: number, name: string }]
  } catch (err) {
    console.error("LLM Error:", err);
    return null;
  }
}

// Example usage:
(async () => {
  const recommendation = await getClothesRecommendation();
  if (recommendation) {
    // Pretty-print nested arrays/objects instead of collapsing to [Array]/[Object]
    console.log("Clothes Recommendation:\n", JSON.stringify(recommendation, null, 2));
  } else {
    console.log("Failed to fetch clothes recommendation.");
  }
})();
