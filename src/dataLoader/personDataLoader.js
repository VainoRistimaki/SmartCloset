import { readFileSync } from 'node:fs';

const PERSON_DATA_FILE = new URL('../../data/person.json', import.meta.url);

export function readPersonData() {
    try {
        const raw = readFileSync(PERSON_DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (error) {
        console.error('Failed to load person data:', error);
        throw error;
    }
}
