import {lightHangers, returnHangers} from './arduino.js';

let hangers = [];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await delay(10000);
await lightHangers([1, 2, 3, 4, 5]);

setInterval(async () => {
    hangers = returnHangers();
    console.log("Current hangers state: ", hangers);
}, 1000);