import { readFile } from 'node:fs/promises';

const CLOTH_DATA_FILE = new URL('../../data/clothes.json', import.meta.url);

export async function getClothData() {
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
