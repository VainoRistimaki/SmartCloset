import { readFile } from 'node:fs/promises';

const DATA_DIR = new URL('../../data/', import.meta.url);
const DEFAULT_CLOTH_DATA_FILE = new URL('clothes.js', DATA_DIR);

function normalizeAvailability(value) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }

    return value === undefined ? true : Boolean(value);
}

class Cloth {
    constructor(item) {
        this.id = item.id;
        this.name = item.name;
        this.type = item.type;
        this.thickness = item.thickness;
        this.seasons = item.seasons;
        this.color = item.color;
        this.formality = item.formality;
        this.style = item.style;
        this.notes = item.notes;
        // Default to available if the field is missing.
        this.availability = normalizeAvailability(item.availability);
        this.resistance = item.resistance;
    }
}

async function readClothesFile(fileUrl = DEFAULT_CLOTH_DATA_FILE) {
    try {
        const raw = await readFile(fileUrl, 'utf-8');
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
            return parsed;
        }

        if (Array.isArray(parsed?.items)) {
            return parsed.items;
        }

        throw new Error('Unexpected cloth data format.');
    } catch (error) {
        console.error(`Failed to load cloth data from ${fileUrl}:`, error);
        throw error;
    }
}

async function getClothesObject(user) {
    // Try user-specific file first (if provided), otherwise fall back to default.
    const filesToTry = [];
    if (user) {
        filesToTry.push(new URL(`${user}_clothes.json`, DATA_DIR));
    }
    filesToTry.push(DEFAULT_CLOTH_DATA_FILE);

    let lastError;
    for (const fileUrl of filesToTry) {
        try {
            const rawClothData = await readClothesFile(fileUrl);
            return rawClothData.map(item => new Cloth(item));
        } catch (error) {
            lastError = error;
            // Only warn on the user-specific file; default failure will throw.
            if (fileUrl !== DEFAULT_CLOTH_DATA_FILE) {
                console.warn(`Falling back to default clothes file due to error with ${fileUrl}:`, error);
            }
        }
    }

    // If we got here, even default failed.
    throw lastError;
}

export { getClothesObject, Cloth };
