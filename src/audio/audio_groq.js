import { config } from 'dotenv';
const envPath = process.env.DOTENV_PATH?.trim(); // allow overriding the .env location if needed
config(envPath ? { path: envPath } : undefined);
import fs from "fs";
import Groq from "groq-sdk";

// Load API key from environment variable for security
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function speechToText(filePath) {
  try {
    // Validate file existence
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const startTime = Date.now();
    
    // Send audio file to Groq API for transcription
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath), // Audio file stream
      model: "whisper-large-v3",           // STT model
      response_format: "text",              // Can be "text", "json", or "verbose_json"
      language: "en"
    });
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`groq_stt processing time: ${elapsedSeconds}s`);
    return transcription;
  } catch (error) {
    console.error("Error during transcription:", error.message);
  }
}

const speechFilePath = "output_audio.mp3";
const model = "playai-tts";
const voice = "Chip-PlayAI";
const responseFormat = "mp3";

export async function textToSpeech(text) {
  const startTime = Date.now();
  const response = await groq.audio.speech.create({
    model: model,
    voice: voice,
    input: text,
    response_format: responseFormat
  });
  
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(speechFilePath, buffer);
  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`groq_tts processing time: ${elapsedSeconds}s`);
}

// const transcription = await speechToText("my_record.mp3");
// console.log(transcription);
// await textToSpeech(transcription);