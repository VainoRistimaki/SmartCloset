import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { User } from './dataLoader/userDataLoader.js';
import perfitChatbot from './llm/perfitChatbot.js';

import readline from "node:readline";
import { startRecording, stopRecording } from './audio/terminal_recorder.js';
//import { speechToText, textToSpeech } from './audio/audio_groq.js';
import { speechToText, textToSpeech } from './audio/audio_whisper.js';

import { emitter as hardwareEmitter } from "./hardware/arduino.js";
//import { emitter as emulatorEmitter } from "./hardware/button_emulator.js";

import pkg from 'play-sound';
const player = pkg();

const absentTimes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]


let playingSound = null;

let chosenHangers = [];

const HARDWARE = true;
let lightHangers = () => {};
let returnHangers = () => [];
const controlEmitter = HARDWARE ? hardwareEmitter : emulatorEmitter;

//The button logic:
controlEmitter.on("recording-changed", value => {
  if (value) {
    startRecording();
  }
  else {
    stopRecording();
    processRecording();
  }
});



//The took hanger logic:

controlEmitter.on("clothes-lifted", lifted => {
    
    if (!chosenHangers.includes(lifted.id)) {
        absentTimes[lifted.id] += 1;
            if (absentTimes > 5) {
                selectClothesAfterPicked(lifted);
            }
    }
});




const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const rl = createInterface({ input, output });


// CLI version
const getUserInput = async (prompt = 'Your input: ') => {
    const answer = await rl.question(prompt);
    return answer.trim();
};


// Initialize user (loads profile + clothes from data/<user>.json and data/<user>_clothes.json)
const userName = "subin";
const user = await User.load(userName);
let clothes = user.clothes;

if (HARDWARE) {
    const hardware = await import('./hardware/arduino.js');
    lightHangers = hardware.lightHangers;
    returnHangers = hardware.returnHangers;

    await delay(10000);
    const hangerReadings = returnHangers(); // returns current hanger cloth objects/null
    clothes = user.syncAvailabilityFromHangers(hangerReadings);
    console.log("Current hangers state: ", hangerReadings.map(h => h ? h.id : null));
} else{
    console.log("Device not connected. Use the default clothes list.");
}

// Initialize user chatbot using user info and clothes data
const myChatbot = perfitChatbot(user); // todo

/*
// Start chatbot loop
while (true) {
    if (!recordingReady) {
        continue;
    }
    recordingReady = false;
    let output;
    /*
    if (userInput.toLowerCase() === 'exit') {
        console.log('Exiting chatbot. Goodbye!');
        break;
    } else if(userInput.toLowerCase() === 'lift') {
        if(HARDWARE) {
            const lifted = findChange(clothes, returnHangers()); // todo
            console.log("Lifted cloth: ", lifted);
            output = await myChatbot.userLifted(lifted); // todo
        } else {
            console.log("Device not connected.");
        }
        continue;
        */
    //} else{
        //output = await myChatbot.userMessage(lastTranscription); // todo
    //}
    /*
    const [recommendation, response] = output;
    if (recommendation) {
        console.log("Clothes Recommendation:\n", JSON.stringify(recommendation, null, 2));
        if(HARDWARE) {
            const indexes = recommendation.sets[0].items.map(item => item.id);
            console.log("Lighting hangers for items with IDs: ", indexes);
            
            const speech = recommendation.sets[0].warmth_reason
            console.log(speech)
            await textToSpeech(speech);
            player.play("output_audio.mp3");

            lightHangers(indexes)
        }
    }
    console.log("Warmth Reasons:\n", response);
}

*/

/*
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

process.on('SIGINT', () => {
  console.log('\nSIGINT received.');
  if (recording) {
    recording = false;
    stopRecording()
};
  setTimeout(() => process.exit(0), 500);
});
*/


async function processRecording() {
    await delay(2000); // wait for file to be finalized
    const audioFilePath = 'my_recording.mp3';
    const transcription = await speechToText(audioFilePath);
   // console.log("Transcription: ", transcription);
    await selectClothes(transcription);
    return transcription;
}



async function selectClothes(input) {
    //hangers = returnHangers();
    const [recommendation, response] = await myChatbot.userMessage(input)
    await playSoundAndLight(recommendation, response);
}

async function selectClothesAfterPicked(input) {
    //hangers = returnHangers();
    const [recommendation, response] = await myChatbot.userLifted(input)
    await playSoundAndLight(recommendation, response);
}

async function playSoundAndLight(recommendation, response) {
    if (recommendation) {
        console.log("Clothes Recommendation:\n", JSON.stringify(recommendation, null, 2));
        const indexes = recommendation.sets[0].items.map(item => item.id);
       
        console.log(response)
        await textToSpeech(response);

        if (playingSound) {
            playingSound.kill();
        }

        playingSound = player.play("output_audio.mp3", function(err){
            if (err && !err.killed) throw err
        });

        console.log("Lighting hangers for items with IDs: ", indexes);
        chosenHangers = indexes;
        lightHangers(indexes)
    }
}
