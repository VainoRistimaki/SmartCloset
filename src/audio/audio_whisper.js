import "dotenv/config"
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export async function speechToText(audio, client = openai, fileSystem = fs) {
  const startTime = Date.now();
  const response = await client.audio.transcriptions.create({
    file: fileSystem.createReadStream(audio),
    model: 'whisper-1',
    language: 'en',
  });
  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`stt_whisper processing time: ${elapsedSeconds}s`);
  return response.text;
}

export async function textToSpeech(text, outputFile="output_audio.mp3", client = openai, fileSystem = fs) {
  const startTime = Date.now();
  const response = await client.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  fileSystem.writeFileSync(outputFile, buffer);
  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`tts_whisper processing time: ${elapsedSeconds}s`);
}