import { readFile } from 'node:fs/promises';
import { getClothesObject, Cloth } from './clothesDataLoader.js';

/**
 * Load a user's profile JSON from data/<user>.json
 * @param {string} userName
 * @returns {Promise<Object|null>} parsed user data or null if missing
 */
async function readUserData(userName) {
    if (!userName) {
        throw new Error('User name is required to load user data.');
    }

    const userFile = new URL(`../../data/${userName}.json`, import.meta.url);
    try {
        const raw = await readFile(userFile, 'utf-8');
        return JSON.parse(raw);
    } catch (error) {
        console.warn(`User data file not found or unreadable for ${userName}:`, error);
        return null;
    }
}

/**
 * Lightweight user model that keeps user info together with their clothes list.
 * Mutations to clothes or preferences should be made by editing the data files, not at runtime.
 */
class User {
  /**
   * @param {Object} params
   * @param {string} params.name
   * @param {Object} [params.profile]    Arbitrary profile fields (height, city, etc).
   * @param {Object} [params.preferences] Style/fit preferences.
   * @param {Cloth[]} [params.clothes]  Preloaded clothes objects.
   * @param {Object} [params.info]       Raw user info from the data file.
   */
  constructor({ name, profile = {}, preferences = {}, clothes = [], info = {} } = {}) {
    this.name = name;
    this.profile = { ...profile };
    this.preferences = { ...preferences };
    this.info = { ...info };
    this.clothes = [...clothes];
  }

  /**
   * Returns all clothes, optionally filtered.
   * @param {(item: Cloth) => boolean} [filterFn]
   * @returns {Cloth[]}
   */
  getClothes(filterFn) {
    if (typeof filterFn === 'function') {
      return this.clothes.filter(filterFn);
    }
    return [...this.clothes];
  }

  /**
   * Update availability flags based on hanger readings (cloth objects or ids).
   * Safe against empty/invalid readings so a hardware glitch won't mark everything unavailable.
   * @param {(number|Cloth|null|undefined)[]} hangerReadings
   * @returns {Cloth[]} Updated clothes list.
   */
  syncAvailabilityFromHangers(hangerReadings = []) {
    if (!Array.isArray(hangerReadings) || hangerReadings.length === 0) {
      return this.clothes;
    }

    const presentIds = new Set(
      hangerReadings
        .map((slot) => {
          if (slot == null) return null;
          if (typeof slot === 'number') return slot;
          if (typeof slot === 'object' && 'id' in slot) return slot.id;
          return null;
        })
        .filter((id) => id !== null && id !== undefined)
    );

    this.clothes.forEach((item) => {
      const available = presentIds.has(item.id);
      item.availability = available;
      item.available = available;
    });

    return this.clothes;
  }

  /**
   * Factory to build a user with preloaded clothes.
   * @param {Object} userData
   * @param {Cloth[]} clothes
   * @returns {User}
   */
  static fromData(userData = {}, clothes = []) {
    const { name, profile, preferences } = userData;
    return new User({ name, profile, preferences, clothes, info: userData });
  }

  /**
   * Load a user and their clothes from data/<user>.json and data/<user>_clothes.json (fallbacks included).
   * @param {string} userName
   * @returns {Promise<User>}
   */
  static async load(userName) {
    const userData = await readUserData(userName);
    const clothes = await getClothesObject(userName);

    const name = userData?.name || userName;
    const profile = userData?.profile || userData?.physicalProfile || {};
    const preferences = userData?.preferences || userData?.stylePreference || {};

    return new User({
      name,
      profile: { ...profile, location: userData?.location },
      preferences,
      clothes,
      info: userData || {},
    });
  }
}

export { readUserData, User };
