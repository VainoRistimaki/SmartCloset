import readline from "node:readline";
import EventEmitter from 'events';
const emitter = new EventEmitter();

let recording = false;

function toggleRecording() {
    recording = !recording
    emitter.emit("recording-changed", recording);
}

function liftClothes(clothes) {
    emitter.emit("clothes-lifted", clothes);
}

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
  if (key && key.name === 'space') {
    toggleRecording();
    return;
  }
  else if (key) {
    //console.log("HERE")
    liftClothes(key.name);
    return;
  }
});

export {emitter, toggleRecording, liftClothes}