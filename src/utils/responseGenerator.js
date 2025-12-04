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

function parseJsonContent(rawContent) {
  // Some models occasionally wrap JSON in code fences; strip them before parsing.
  const fencedMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonString = fencedMatch ? fencedMatch[1].trim() : rawContent.trim();
  return JSON.parse(jsonString);
}

export async function getClothesRecommendation(userInput="What should I wear today?") {
  try {
    const prompt = await buildPrompt();

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You respond ONLY with valid JSON.
Outline:
  1) Derive a target warmth level from weather:
     - feelslike ≤5°C -> warmth 5 (heavy outer, insulating mid, base)
     - 6-12°C -> warmth 4 (warm outer or layered mid+base)
     - 13-18°C -> warmth 3 (mid layer + base)
     - 19-24°C -> warmth 2 (light layer or breathable base)
     - ≥25°C -> warmth 1 (lightest, breathable)
     Increase warmth by 1 if wind_kph >20 or precip_mm >0.
  2) Each set must hit the target warmth using available items’ Thickness (lightweight < medium < heavyweight); layer to reach target when needed.
  3) No alternatives inside a set. Output 2-3 sets.
JSON shape:
{
  "sets": [
    {
      "name": "Set 1",
      "items": [ { "id": number, "name": string } ],
      "warmth_reason": "Why thickness matches weather, incl. key weather factors"
    }
  ]
}
No extra text outside JSON.
          `,
        },
        { role: "developer", content: prompt },
        { role: "user", content: userInput }
      ],
      temperature: 0.4
    });

    const raw = response.choices[0].message.content || "";
    const json = parseJsonContent(raw);

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
