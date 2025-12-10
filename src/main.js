import { lightHangers, returnHangers } from './hardware/arduino.js';
import { getClothesRecommendation } from './llm/responseGenerator.js';
import readline from "node:readline";
import { startRecording, stopRecording } from './audio/terminal_recorder.js';
import { speechToText, textToSpeech } from './audio/audio_groq.js';
//import {player} from 'play-sound'
//import {speechToText} from './audio/audio_whisper.js';

import pkg from 'play-sound';

const player = pkg();

let hangers = [];
let recording = false;


const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//const text = await speechToText("../public/my_record.mp3");

//console.log(text);

await delay(8000);

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

console.log('Press SPACE to start/stop recording. Press Ctrl+C to exit.');

process.stdin.on('keypress', (str, key) => {
  // key.sequence might be ' ' for space
  if (key && key.name === 'space') {
    if (!recording) {
        recording = true;
        startRecording();
    }
    else {
        recording = false;
        stopRecording();
        processRecording();
    };
    return;
  }

  // exit on ctrl+c or ctrl+d
  if ((key && key.ctrl && key.name === 'c') || key.sequence === '\u0004') {
    if (recording) {
        recording = false;
      console.log('Stopping active recording before exit...');
      stopRecording();
      // wait a little for ffmpeg to exit
      setTimeout(() => process.exit(0), 1000);
    } else {
      process.exit(0);
    }
  }
});

// also handle process signals
process.on('SIGINT', () => {
  console.log('\nSIGINT received.');
  if (recording) {
    recording = false;
    stopRecording()
};
  setTimeout(() => process.exit(0), 500);
});


async function processRecording() {
    await delay(2000); // wait for file to be finalized
    const audioFilePath = 'my_recording.mp3';
    const transcription = await speechToText(audioFilePath);
    console.log("Transcription: ", transcription);
    await selectClothes(transcription);
    return transcription;
}

//await selectClothes("I have to run marathon");
//await lightHangers([1, 2, 3, 4, 5]);

/*
setInterval(async () => {
    hangers = returnHangers();
    console.log("Current hangers state: ", hangers.map(h => h ? h.id : null));
}, 1000);
*/


async function selectClothes(input) {
    //hangers = returnHangers();
    const recommendation = await getClothesRecommendation(input);

    if (recommendation) {
        console.log("Clothes Recommendation:\n", JSON.stringify(recommendation, null, 2));
        const indexes = recommendation.sets[0].items.map(item => item.id);
        const speech = recommendation.sets[0].explanation
        console.log(speech)
        
        await textToSpeech(speech);

        //await delay(1000);

        player.play("output_audio.mp3");

        console.log("Lighting hangers for items with IDs: ", indexes);
        lightHangers(indexes)
    }
}
