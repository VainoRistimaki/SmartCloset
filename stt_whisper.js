import "dotenv/config"
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const startTime = Date.now();
const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream("my_record.mp3"),
  model: "whisper-1",
  language: "en",
});

const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`stt_whisper processing time: ${elapsedSeconds}s`);
console.log(transcription.text);
