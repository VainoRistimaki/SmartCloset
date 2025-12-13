import "dotenv/config";
import OpenAI from "openai";
import {
  buildSystemPrompt,
  buildUserInfoPrompt,
  buildWeatherPrompt,
} from "./promptBuilder.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error(
    "Missing OpenAI credentials. Set OPENAI_API_KEY in your environment or .env file."
  );
}

const client = new OpenAI({ apiKey });

function parseJsonContent(rawContent) {
  const fencedMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonString = fencedMatch ? fencedMatch[1].trim() : rawContent.trim();
  return JSON.parse(jsonString);
}

const outfitResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "outfit_sets",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["sets"],
      properties: {
        sets: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["items", "explanation"],
            properties: {
              explanation: { type: "string" },
              items: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "name"],
                  properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

function describeCloth(item) {
  return "id " + item
  /*
  if (!item) return "";
  const id = item.id ?? "unknown-id";
  const name = item.name ? String(item.name) : "unknown-name";
  const type = item.type ? ` (${item.type})` : "";
  return `${name}${type} [id:${id}]`;
  */
}

class PerfitChatbot {
  constructor(user) {
    this.user = user;
    this.messages = [];
    this.ready = this.initialize();
  }

  async initialize() {
    const systemPrompt = await buildSystemPrompt();
    const userInfoPrompt = await buildUserInfoPrompt(this.user);
    const weatherPrompt = await buildWeatherPrompt(this.user);

    if (systemPrompt) this.messages.push({ role: "system", content: systemPrompt });
    if (userInfoPrompt) this.messages.push({ role: "developer", content: userInfoPrompt });
    if (weatherPrompt) this.messages.push({ role: "developer", content: weatherPrompt });
  }

  async userMessage(userInput = "what should i wear today?") {
    await this.ready;
    this.messages.push({ role: "user", content: userInput });

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: outfitResponseFormat,
      messages: this.messages,
      temperature: 0.4,
    });

    const raw = response.choices[0]?.message?.content || "";
    this.messages.push({ role: "assistant", content: raw });
    let json = null;
    try {
      json = parseJsonContent(raw);
    } catch (err) {
      console.error("LLM parse error:", err);
    }

    const recommendation = json?.sets
      ? json.sets.map(({ items }) => items)
      : null;

    const explanation = json?.sets
      ? json.sets
          .map(({ explanation }) => explanation || "No explanation provided.")
      : raw;

    return [recommendation, explanation];
  }

  async userLifted(lifted) {
    await this.ready;
    const liftedText = Array.isArray(lifted)
      ? lifted.map(describeCloth).filter(Boolean).join(", ")
      : describeCloth(lifted);

    //const liftedText = lifted

    const updateMessage = liftedText
      ? `Hanger update: user picked up cloth number ${liftedText}. Consider availability changes if relevant.`
      : "Hanger update: change detected but no item details available.";

    console.log(updateMessage);
    this.messages.push({ role: "developer", content: updateMessage });
    return this.userMessage("옷걸이 상태가 변경됐어. 새로운 추천을 부탁해.");
  }
}

export function perfitChatbot(user) {
  return new PerfitChatbot(user);
}

export default perfitChatbot;

/*
// Example usage:
(async () => {
  const { createInterface } = await import("node:readline/promises");
  const { User } = await import("../dataLoader/userDataLoader.js");
  const user = await User.load("subin"); // Load user profile + clothes
  const chatbot = perfitChatbot(user);

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  while (true) {
    const userText = (await rl.question("Ask the chatbot (or type 'exit' to quit): ")).trim();
    if (!userText) {
      console.log("Please enter a question or type 'exit'.");
      continue;
    }
    if (userText.toLowerCase() === "exit") break;

    const [recommendation, response] = await chatbot.userMessage(userText);
    if (Array.isArray(recommendation) && Array.isArray(response)) {
      recommendation.forEach((items, idx) => {
        console.log(`Clothes Recommendation [${idx}]:\n`, items);
        console.log(`Explanation [${idx}]:\n`, response[idx] ?? "No explanation provided.");
      });
    } else {
      console.log("Clothes Recommendation:\n", recommendation);
      console.log("Explanation:\n", response);
    }
  }

  rl.close();
})();
*/
