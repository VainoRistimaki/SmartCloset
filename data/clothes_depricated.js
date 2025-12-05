/*
{
  "metadata": {
    "schemaVersion": "2.0",
    "lastUpdated": "2025-11-24",
    "description": "Cloth catalog with canonical items plus type/formality/season/style lookup indexes sourced from cloth.js."
  },
  "items": [
    {
      "id": 0,
      "availability": "True",
      "name": "Black Coat",
      "type": "outer",
      "thickness": 4,
      "color": "black",
      "formality": ["formal"],
      "style": ["chic", "minimal"],
      "seasons": ["fall", "winter"],
      "notes": "Structured wool coat that layers cleanly over office outfits.",
      "resistance": 47
    },
    {
      "id": 1,
      "availability": "True",
      "name": "White Puffer Jacket",
      "type": "outer",
      "thickness": 5,
      "color": "white",
      "formality": ["casual"],
      "style": ["casual", "minimal"],
      "seasons": ["winter"],
      "notes": "Long puffer built for freezing commutes and windy walks.",
      "resistance": 100
    },
    {
      "id": 2,
      "availability": "True",
      "name": "Sky Blue Knit",
      "type": "top",
      "thickness": 3,
      "color": "skyblue",
      "formality": ["casual", "formal"],
      "style": ["cute", "minimal"],
      "seasons": ["spring", "fall", "winter"],
      "notes": "Soft knit that balances denim for weekends or slacks for work.",
      "resistance": 220
    },
    {
      "id": 3,
      "availability": "True",
      "name": "Pink Knit",
      "type": "top",
      "thickness": 3,
      "color": "pink",
      "formality": ["casual", "formal"],
      "style": ["feminine"],
      "seasons": ["spring", "fall", "winter"],
      "notes": "Playful knit that still works with tailored trousers or skirts.",
      "resistance": 330
    },
    {
      "id": 4,
      "availability": "True",
      "name": "White Blouse",
      "type": "top",
      "thickness": 1,
      "color": "white",
      "formality": ["formal"],
      "style": ["feminine", "formal"],
      "seasons": ["spring", "summer", "fall"],
      "notes": "Crisp blouse that completes suiting sets or elevated skirts.",
      "resistance": 680
    },
    {
      "id": 5,
      "availability": "True",
      "name": "Beige Sweatshirt",
      "type": "top",
      "thickness": 2,
      "color": "beige",
      "formality": ["casual"],
      "style": ["casual", "minimal"],
      "seasons": ["spring", "fall", "winter"],
      "notes": "Cozy crewneck for relaxed errand outfits or lounge layers.",
      "resistance": 1000
    },
    {
      "id": 6,
      "availability": "True",
      "name": "White Short-Sleeve Tee",
      "type": "top",
      "thickness": 1,
      "color": "white",
      "formality": ["casual"],
      "style": ["minimal", "sporty"],
      "seasons": ["spring", "summer"],
      "notes": "Classic base layer to pair with denim, shorts, or skirts.",
      "resistance": 2200
    },
    {
      "id": 7,
      "availability": "True",
      "name": "Grey Short-Sleeve Tee",
      "type": "top",
      "thickness": 1,
      "color": "grey",
      "formality": ["casual"],
      "style": ["casual", "feminine"],
      "seasons": ["spring", "summer"],
      "notes": "Neutral tee that complements muted or monochrome looks.",
      "resistance": 3300
    },
    {
      "id": 8,
      "availability": "True",
      "name": "Black Bootcut Pants",
      "type": "bottom",
      "thickness": 2,
      "color": "black",
      "formality": ["casual", "formal"],
      "style": ["minimal", "feminine"],
      "seasons": ["spring", "fall", "winter"],
      "notes": "Tailored bootcut pants that strike a balance between polish and comfort.",
      "resistance": 4700
    },
    {
      "id": 9,
      "availability": "True",
      "name": "Gray Sweatpants",
      "type": "bottom",
      "thickness": 2,
      "color": "gray",
      "formality": ["casual"],
      "style": ["sporty", "casual"],
      "seasons": ["fall", "winter"],
      "notes": "Relaxed sweatpants for lounging or athleisure commutes.",
      "resistance": 10000
    }
  ],
  "indexes": {
    "byType": {
      "outer": [1, 2],
      "top": [3, 4, 5, 6, 7, 8],
      "bottom": [9, 10, 11, 12]
    },
    "byFormality": {
      "casual": [2, 3, 4, 6, 7, 8, 9, 10, 11, 12],
      "formal": [1, 3, 4, 5, 9, 11]
    },
    "bySeason": {
      "spring": [3, 4, 5, 6, 7, 8, 9, 11, 12],
      "summer": [5, 7, 8, 11],
      "fall": [1, 3, 4, 5, 6, 9, 10, 11, 12],
      "winter": [1, 2, 3, 4, 6, 9, 10, 12]
    },
    "byStyle": {
      "casual": [2, 6, 8, 10, 12],
      "chic": [1],
      "cute": [3],
      "feminine": [4, 5, 8, 9, 11],
      "formal": [5],
      "minimal": [1, 2, 3, 6, 7, 9, 12],
      "sporty": [7, 10]
    }
  }
}
*/