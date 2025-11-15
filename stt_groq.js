/**
 * Groq Speech-to-Text Example in JavaScript
 * Requires: npm install groq-sdk
 */
import { config } from 'dotenv';
const envPath = process.env.DOTENV_PATH?.trim(); // allow overriding the .env location if needed
config(envPath ? { path: envPath } : undefined);
import fs from "fs";
import Groq from "groq-sdk";

// Load API key from environment variable for security
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function transcribeAudio(filePath) {
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
      response_format: "text"              // Can be "text", "json", or "verbose_json"
    });
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`groq_whisper processing time: ${elapsedSeconds}s`);

    console.log("Transcription result:");
    console.log(transcription);
  } catch (error) {
    console.error("Error during transcription:", error.message);
  }
}

// Example usage: node stt_groq.js ./audio.mp3
const audioFile = "my_record.mp3"
if (!audioFile) {
  const scriptName = process.argv[1]?.split(/[\\/]/).pop() || "stt_groq.js";
  console.error(`Usage: node ${scriptName} <audio-file-path>`);
  process.exit(1);
}


transcribeAudio(audioFile);