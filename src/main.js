import {lightHangers, returnHangers} from './arduino.js';
import { getClothesRecommendation } from './utils/responseGenerator.js';

let hangers = [];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


await selectClothes("I have to run marathon");


//await delay(10000);
//await lightHangers([1, 2, 3, 4, 5]);


setInterval(async () => {
    hangers = returnHangers();
    console.log("Current hangers state: ", hangers);
}, 1000);



async function selectClothes(input) {
    //hangers = returnHangers();
    const recommendation = await getClothesRecommendation(input);

    if (recommendation) {
        console.log("Clothes Recommendation:\n", JSON.stringify(recommendation, null, 2));
        const indexes = recommendation.sets[0].items.map(item => item.id);
        console.log("Lighting hangers for items with IDs: ", indexes);
        lightHangers(indexes)
    }
}