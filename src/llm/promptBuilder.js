import { getWeatherData } from '../dataLoader/weatherDataLoader.js';
import { User } from '../dataLoader/userDataLoader.js';
//import { zodTextFormat } from "openai/helpers/zod";
//import { z } from "zod";

async function buildPrompt(userName = 'subin') {
    const user = await User.load(userName);
    const personData = user.info || {};
    const profile = personData.physicalProfile || user.profile || {};
    const stylePreference = Array.isArray(personData.stylePreference) ? [...personData.stylePreference] : [];
    const city = personData.location?.city || user.profile?.location?.city;
    const weatherData = city ? await getWeatherData(city) : null;
    const clothData = user.clothes || [];
    let prompt = `You are a fashion assistant. Based on the following information, suggest an outfit.\n\n`;

    prompt += `Person Profile:\n`;
    prompt += `- Name: ${user.name || ''}\n`;
    prompt += `- Age: ${personData.age ?? ''}\n`;
    prompt += `- Job: ${personData.job ?? ''}\n`;
    prompt += `- Ethnicity: ${personData.ethnicity ?? personData.ehtnicity ?? ''}\n\n`;

    prompt += `Physical Profile:\n`;
    prompt += `- Height: ${profile.heightCm ?? ''} cm\n`;
    prompt += `- Weight: ${profile.weightKg ?? ''} kg\n`;
    prompt += `- Gender: ${profile.gender ?? ''}\n\n`;
    prompt += `- Skin Tone: ${profile.skinTone ?? ''}\n\n`;

    prompt += `Style Preferences (in order of priority):\n`;
    stylePreference
        .sort((a, b) => a.priority - b.priority)
        .forEach((pref, index) => {
            prompt += `${index + 1}. ${pref.style}\n`;
        });
    prompt += `\n`;

    if (weatherData) {
        prompt += `Current Weather in ${city}:\n`;
        prompt += `- Temperature: ${weatherData.temp_c} °C\n`;
        prompt += `- Feeling Temperature: ${weatherData.feelslike_c} °C\n`;
        prompt += `- Wind: ${weatherData.wind_kph} kph\n`;
        prompt += `- Cloud: ${weatherData.cloud}\n`;
        prompt += `- Precipitation: ${weatherData.precip_mm} mm\n\n`;
    }
    
    prompt += `Available Clothes:\n`;
    
    // console.log(clothData[11])
    // clothData[11].available = false;
    // clothData[8].available = false;
    clothData
        .filter(item => item.available !== false && item.availability !== false)
        .forEach((item, index) => {
            prompt += `${index}. ${item.name} - Type: ${item.type}, Thickness: ${item.thickness}, Color: ${item.color}, Formality: ${item.formality}\n`;
        });
    prompt += `\nBased on the above information, suggest a suitable outfit for today. If you cannot meet the target warmth with available thickness, say so in explanation instead of ignoring thickness.`;

    return prompt;
}

/*
const Recommendation = z.object({
    clotheNames: z.array(z.string()),
    reason: z.string()
})*/

export async function buildSystemPrompt() {
    return `
You respond ONLY with valid JSON.
Outline:
  1) Derive a target warmth level from weather:
     - feelslike <= 5°C -> warmth 5 (heavy outer, insulating mid, base)
     - 6-12°C -> warmth 4 (warm outer or layered mid+base)
     - 13-18°C -> warmth 3 (mid layer + base)
     - 19-24°C -> warmth 2 (light layer or breathable base)
     - >= 25°C -> warmth 1 (lightest, breathable)
     Increase warmth by 1 if wind_kph > 20 or precip_mm > 0.
  2) Each set must hit the target warmth using available items' Thickness (lightweight < medium < heavyweight); layer to reach target when needed.
  3) No alternatives inside a set. Output 2-3 sets.
JSON shape:
{
  "sets": [
    {
      "name": "Set 1",
      "items": [ { "id": number, "name": string } ],
      "explanation": "Why thickness matches weather, incl. key weather factors"
    }
  ]
}
No extra text outside JSON.
`.trim();
}

export async function buildUserInfoPrompt(userInput) {
    const user = typeof userInput === 'string' ? await User.load(userInput) : userInput;
    if (!user) return '';

    const personData = user.info || {};
    const profile = personData.physicalProfile || user.profile || {};
    const stylePreference = Array.isArray(personData.stylePreference) ? [...personData.stylePreference] : [];
    const clothData = user.clothes || [];

    let prompt = `Person Profile:\n`;
    prompt += `- Name: ${user.name || ''}\n`;
    prompt += `- Age: ${personData.age ?? ''}\n`;
    prompt += `- Job: ${personData.job ?? ''}\n`;
    prompt += `- Ethnicity: ${personData.ethnicity ?? personData.ehtnicity ?? ''}\n\n`;

    prompt += `Physical Profile:\n`;
    prompt += `- Height: ${profile.heightCm ?? ''} cm\n`;
    prompt += `- Weight: ${profile.weightKg ?? ''} kg\n`;
    prompt += `- Gender: ${profile.gender ?? ''}\n`;
    prompt += `- Skin Tone: ${profile.skinTone ?? ''}\n\n`;

    prompt += `Style Preferences (in order of priority):\n`;
    stylePreference
        .sort((a, b) => a.priority - b.priority)
        .forEach((pref, index) => {
            prompt += `${index + 1}. ${pref.style}\n`;
        });
    prompt += `\n`;

    prompt += buildClothesPrompt(clothData);
    prompt += `\nBased on the above information, suggest a suitable outfit for today. If you cannot meet the target warmth with available thickness, say so in explanation instead of ignoring thickness.`;

    return prompt.trim();
}

export async function buildWeatherPrompt(userInput) {
    const user = typeof userInput === 'string' ? await User.load(userInput) : userInput;
    const city =
        user?.info?.location?.city ||
        user?.profile?.location?.city ||
        user?.info?.city ||
        user?.profile?.city;

    if (!city) {
        return 'Weather: City is unknown, so weather data is unavailable.';
    }

    const weatherData = await getWeatherData(city);
    if (!weatherData) {
        return `Weather data unavailable for ${city}.`;
    }

    let prompt = `Current Weather in ${city}:\n`;
    prompt += `- Temperature: ${weatherData.temp_c} °C\n`;
    prompt += `- Feeling Temperature: ${weatherData.feelslike_c} °C\n`;
    prompt += `- Wind: ${weatherData.wind_kph} kph\n`;
    prompt += `- Cloud: ${weatherData.cloud}\n`;
    prompt += `- Precipitation: ${weatherData.precip_mm} mm\n`;

    return prompt.trim();
}

export function buildClothesPrompt(clothData){
    let prompt = `Available Clothes:\n`;
    clothData
        .filter(item => item.available !== false && item.availability !== false)
        .forEach((item, index) => {
            prompt += `${index}. ${item.name} - Type: ${item.type}, Thickness: ${item.thickness}, Color: ${item.color}, Formality: ${item.formality}\n`;
        });
    return prompt;
}


// const prompt = await buildPrompt();
// console.log('Generated Prompt:\n', prompt);
