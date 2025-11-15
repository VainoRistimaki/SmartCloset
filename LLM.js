import OpenAI from "openai";
import { buildPrompt } from "./promptBuilder.js";
import fs from "fs";

const clothes = JSON.parse(fs.readFileSync("./cloth.json", "utf-8"));

// OpenAI 클라이언트 생성
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// STT string, Weather 정보 받아서 LLM에 전달 → JSON 형태로 옷 추천 받기

export async function getClothesRecommendation(stt, weather) {
  try {
    // 1. 프롬프트 생성
    const prompt = buildPrompt(stt, weather);

    // 2. LLM 호출
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You respond ONLY with valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    });

    // 3. 결과 받아오기
    const raw = response.choices[0].message.content.trim();

    // 4. JSON 파싱
    const json = JSON.parse(raw);

    return json; // → [{ id: number, name: string }]
  } catch (err) {
    console.error("LLM Error:", err);
    return null;
  }
}
