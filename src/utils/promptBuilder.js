import { getWeatherData } from '../dataLoader/weatherDataLoader.js';
import { readPersonData } from '../dataLoader/personDataLoader.js';
import { getClothData } from '../dataLoader/clothesDataLoader.js';

export async function buildPrompt() {
    const personData = readPersonData();
    const weatherData = await getWeatherData(personData.location.city);
    const clothData = await getClothData();
    let prompt = `You are a fashion assistant. Based on the following information, suggest an outfit.\n\n`;

    prompt += `Person Profile:\n`;
    prompt += `- Name: ${personData.name}\n`;
    prompt += `- Age: ${personData.age}\n`;
    prompt += `- Job: ${personData.job}\n`;
    prompt += `- Ethnicity: ${personData.ethnicity}\n\n`;

    prompt += `Physical Profile:\n`;
    prompt += `- Height: ${personData.physicalProfile.heightCm} cm\n`;
    prompt += `- Weight: ${personData.physicalProfile.weightKg} kg\n`;
    prompt += `- Gender: ${personData.physicalProfile.gender}\n\n`;
    prompt += `- Skin Tone: ${personData.physicalProfile.skinTone}\n\n`;

    prompt += `Style Preferences (in order of priority):\n`;
    personData.stylePreference
        .sort((a, b) => a.priority - b.priority)
        .forEach((pref, index) => {
            prompt += `${index + 1}. ${pref.style}\n`;
        });
    prompt += `\n`;

    prompt += `Current Weather in ${personData.location.city}:\n`;
    prompt += `- Temperature: ${weatherData.temp_c} °C\n`;
    prompt += `- Feeling Temperature: ${weatherData.feelslike_c} °C\n`;
    prompt += `- Wind: ${weatherData.wind_kph} kph\n`;
    prompt += `- Cloud: ${weatherData.cloud}\n`;
    prompt += `- Precipitation: ${weatherData.precip_mm} mm\n\n`;
    
    prompt += `Available Clothes:\n`;
    clothData.forEach((item, index) => {
        prompt += `${index + 1}. ${item.name} - Type: ${item.type}, Thickness: ${item.thickness}, Color: ${item.color}, Formality: ${item.formality}\n`;
    });
    prompt += `\nBased on the above information, suggest a suitable outfit for today. If you cannot meet the target warmth with available thickness, say so in warmth_reason instead of ignoring thickness.`;

    return prompt;
}

// const prompt = await buildPrompt();
// console.log('Generated Prompt:\n', prompt);
