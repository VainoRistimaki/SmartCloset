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

function describeCloth(item) {
  if (!item) return "";
  const id = item.id ?? "unknown-id";
  const name = item.name ? String(item.name) : "unknown-name";
  const type = item.type ? ` (${item.type})` : "";
  return `${name}${type} [id:${id}]`;
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

  async userMessage(userInput = "오늘 뭐 입을까?") {
    await this.ready;
    this.messages.push({ role: "user", content: userInput });

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: this.messages,
      temperature: 0.4,
    });

    const raw = response.choices[0]?.message?.content || "";
    let json = null;
    try {
      json = parseJsonContent(raw);
    } catch (err) {
      console.error("LLM parse error:", err);
    }

    const recommendation = json?.sets
      ? {
          sets: json.sets.map(({ name, items }) => ({
            name,
            items,
          })),
        }
      : null;

    const warmthOnly = json?.sets
      ? json.sets
          .map(({ name, warmth_reason }) => `${name || "Set"}: ${warmth_reason || "No warmth reason provided."}`)
          .join("\n")
      : raw;

    this.messages.push({ role: "assistant", content: raw });
    return [recommendation, warmthOnly];
  }

  async userLifted(lifted) {
    await this.ready;
    /*
    const liftedText = Array.isArray(lifted)
      ? lifted.map(describeCloth).filter(Boolean).join(", ")
      : describeCloth(lifted);
      */
    const liftedText = lifted

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
