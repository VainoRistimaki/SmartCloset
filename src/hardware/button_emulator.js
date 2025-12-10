import readline from "node:readline";
import EventEmitter from 'events';
const emitter2 = new EventEmitter();

let recording = false;

function toggleRecording() {
    recording = !recording
    emitter2.emit("recording-changed", recording);
}

function liftClothes(clothes) {
    emitter2.emit("clothes-lifted", clothes);
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

export {emitter2, toggleRecording, liftClothes}