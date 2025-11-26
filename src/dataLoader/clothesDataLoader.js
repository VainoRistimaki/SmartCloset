import { readFile } from 'node:fs/promises';
import { get } from 'node:http';

const CLOTH_DATA_FILE = new URL('../../data/clothes.json', import.meta.url);

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
        this.note = item.note;
        this.available = true;
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

async function genClothObjects(){
    const rawClothData = await getClothData();
    return rawClothData.map(item => new ClothesData(item));
}

// console.log(await genClothObjects());

export { getClothData, genClothObjects };