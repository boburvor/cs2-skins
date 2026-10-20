export const RARITIES = ["Common", "Rare", "Epic", "Legendary", "Mythic"];

export const RARITY = {
  Common: { label: "Oddiy", color: "var(--r-common)" },
  Rare: { label: "Noyob", color: "var(--r-rare)" },
  Epic: { label: "Epik", color: "var(--r-epic)" },
  Legendary: { label: "Afsonaviy", color: "var(--r-legendary)" },
  Mythic: { label: "Mifik", color: "var(--r-mythic)" },
};

export const rarityOf = (r) => RARITY[r] || RARITY.Common;

export const money = (n) =>
  "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const dateFmt = (d) =>
  new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

// Backend'dagi src/config/game.js dagi EXPENSIVE_CHANCE bilan bir xil bo'lishi kerak (foizda)
export const EXPENSIVE_CHANCE = 25;
