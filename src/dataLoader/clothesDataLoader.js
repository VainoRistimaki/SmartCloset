import { readFile } from 'node:fs/promises';

const CLOTH_DATA_FILE = new URL('../../data/clothes.json', import.meta.url);

function normalizeAvailability(value) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }

    return value === undefined ? true : Boolean(value);
}

class ClothesData{
    constructor(item){
        this.id = item.id;
        this.name = item.name;
        this.type = item.type;
        this.thickness = item.thickness;
        this.seasons = item.seasons;
        this.color = item.color;
        this.formality = item.formality;
        this.style = item.style;
        this.note = item.note ?? item.notes;
        this.available = normalizeAvailability(item.availability ?? item.available);
    }
}

async function getClothData() {
    try {
        const raw = await readFile(CLOTH_DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
            return parsed;
        }

        if (Array.isArray(parsed?.items)) {
            return parsed.items;
        }

        throw new Error('Unexpected cloth data format.');
    } catch (error) {
        console.error('Failed to load cloth data:', error);
        throw error;
    }
}

async function getClothesObjects(){
    const rawClothData = await getClothData();
    return rawClothData.map(item => new ClothesData(item));
}

const genClothObjects = getClothesObjects;

// console.log(await getClothesObjects());

export { getClothData, getClothesObjects, genClothObjects };
