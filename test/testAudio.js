// import { speechToText, textToSpeech } from "./audio_whisper.js";
import { speechToText, textToSpeech } from "../src/audio_groq.js";

let transcription = await speechToText("my_record.mp3").catch((err) => {
  console.error("[STT ERROR]", err);
});
console.log("[STT RESULT]", transcription);

await textToSpeech(transcription, "output_audio.mp3").catch((err) => {
  console.error("[TTS ERROR]", err);
});