const crypto = require("crypto");

// Admin omborida turgan skin (eski skinlarda `owner` maydoni yo'q bo'lishi mumkin)
const IN_STOCK = { $or: [{ owner: "admin" }, { owner: { $exists: false } }] };

// Pul hisobida 0.1 + 0.2 kabi xatolar bo'lmasligi uchun 2 xonagacha yaxlitlaymiz
const round2 = (n) => Math.round(Number(n) * 100) / 100;

// 0 dan (max - 1) gacha xavfsiz tasodifiy butun son
const randomInt = (max) => crypto.randomInt(0, max);

// `chance` ehtimol bilan true qaytaradi (0.25 = 25%)
const rollChance = (chance) => crypto.randomInt(0, 10000) < chance * 10000;

module.exports = { IN_STOCK, round2, randomInt, rollChance };
