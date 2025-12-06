import { lightHangers, returnHangers } from './hardware/arduino.js';
import { getClothesRecommendation } from './llm/responseGenerator.js';

let hangers = [];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


await delay(10000);

await selectClothes("I have to run marathon");
//await lightHangers([1, 2, 3, 4, 5]);


setInterval(async () => {
    hangers = returnHangers();
    console.log("Current hangers state: ", hangers.map(h => h ? h.id : null));
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
