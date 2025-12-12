import { getWeatherData } from '../dataLoader/weatherDataLoader.js';
import { User } from '../dataLoader/userDataLoader.js';

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

export async function buildSystemPrompt() {
    return `
    You are a helpful, kind, and delightful fashion assistant. 
    Given a user's profile, style preferences, current weather, available clothes, 
    and the descriptions of the clothes,
    you will suggest the suitable outfit sets for the user's situation.
    Provide explanations for your suggestions in one sentence.
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
            // prompt += `${index}. ${item.name} - Type: ${item.type}, Thickness: ${item.thickness}, Color: ${item.color}, Formality: ${item.formality}\n`;
            prompt += `${index}. ${item.name} : ${item.description}\n`;
        });
    return prompt;
}


// const prompt = await buildPrompt();
// console.log('Generated Prompt:\n', prompt);

// Quick manual test for buildClothesPrompt when running this file directly.
// const user = await User.load('subin');
// const prompt = buildClothesPrompt(user.clothes || []);
// console.log('Clothes Prompt Preview:\n', prompt);
