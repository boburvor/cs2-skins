// Demo ma'lumotlar bilan bazani to'ldiradi.
//   npm run seed            (bor bo'lsa o'tkazib yuboradi)
//   npm run seed -- --reset (demo ma'lumotlarni o'chirib, qaytadan yaratadi)
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/users.model");
const Skin = require("../models/skins.model");
const Case = require("../models/cases.model");

const ROOT = path.join(__dirname, "../..");

const ADMIN = { name: "Admin", phone_number: "+998900000001", email: "admin@skinmarket.uz", password: "Admin123!", role: "admin" };
const DEMO = { name: "Demo User", phone_number: "+998900000002", email: "demo@skinmarket.uz", password: "Demo1234!" };

// [nomi, daraja, narx, rasm]
const CASES = [
  {
    name: "Starter keysi", price: 5, rarity: "Common", expensiveFrom: 100,
    skins: [
      ["P250 | Sand Dune", "Common", 3], ["MP9 | Storm", "Common", 4], ["UMP-45 | Carbon", "Common", 5],
      ["Five-SeveN | Forest", "Common", 6], ["MAC-10 | Silver", "Common", 6], ["G3SG1 | Contractor", "Common", 7],
      ["Nova | Walnut", "Common", 8], ["SG 553 | Navy", "Common", 9], ["SSG 08 | Blue Spruce", "Rare", 18],
      ["P90 | Teal Blaze", "Rare", 22], ["Tec-9 | Isaac", "Rare", 25], ["FAMAS | Neon Rider", "Rare", 30],
      ["AK-47 | Slate", "Rare", 45, "ak47-olive.png"], ["Desert Eagle | Rust Coat", "Epic", 110], ["USP-S | Orion", "Epic", 140],
      ["AWP | Dust", "Epic", 180, "dragon-lore.jpg"],
    ],
  },
  {
    name: "Hunter keysi", price: 25, rarity: "Rare", expensiveFrom: 300,
    skins: [
      ["Galil AR | Cerberus", "Rare", 28], ["MP7 | Bloodsport", "Rare", 35], ["Glock-18 | Candy Apple", "Rare", 60],
      ["AK-47 | Olive Drab", "Epic", 75, "ak47-olive.png"], ["M4A1-S | Atomic", "Epic", 95], ["AWP | Pit Viper", "Epic", 140, "dragon-lore.jpg"],
      ["P250 | Whiteout", "Epic", 120], ["Five-SeveN | Hyper", "Epic", 160], ["MAC-10 | Neon", "Epic", 210],
      ["USP-S | Kill Confirmed", "Legendary", 340], ["AK-47 | Redline", "Legendary", 420, "ak47-olive.png"],
      ["Butterfly | Night", "Legendary", 560], ["M4A4 | Neo-Noir", "Legendary", 700],
    ],
  },
  {
    name: "Prime keysi", price: 120, rarity: "Epic", expensiveFrom: 800,
    skins: [
      ["Desert Eagle | Blaze", "Epic", 85], ["Glock-18 | Fade", "Epic", 95], ["SG 553 | Cyrex", "Rare", 45],
      ["AWP | Asiimov", "Epic", 220, "dragon-lore.jpg"], ["M4A1-S | Hyper Beast", "Epic", 260], ["AK-47 | Vulcan", "Legendary", 380, "ak47-olive.png"],
      ["Karambit | Fade", "Legendary", 900], ["M4A4 | Howl", "Mythic", 1200], ["AWP | Dragon Lore", "Mythic", 1500, "dragon-lore.jpg"],
      ["Gloves | Pandora", "Mythic", 1800], ["Butterfly | Doppler", "Mythic", 2100],
    ],
  },
];

// Omborda (bozorda) turadigan skinlar
const STOCK = [
  ["AWP | Pink DDPAT", "Rare", 75, "dragon-lore.jpg"], ["M4A1-S | Ash", "Common", 40], ["USP-S | Orion Blue", "Epic", 130],
  ["AK-47 | Jet Set", "Epic", 195, "ak47-olive.png"], ["Glock-18 | Water Elemental", "Epic", 240], ["Karambit | Night", "Legendary", 480],
  ["P90 | Asiimov", "Epic", 150], ["SSG 08 | Dragonfire", "Legendary", 610], ["MP9 | Hot Rod", "Rare", 55],
  ["Desert Eagle | Printstream", "Mythic", 950],
];

// Demo userning inventaridagi skinlar
const DEMO_OWNED = [["AK-47 | Fire Serpent", "Mythic", 1350, "ak47-olive.png"], ["P250 | Muertos", "Rare", 38]];

const seedNames = () => [
  ...CASES.flatMap((c) => c.skins.map((s) => s[0])),
  ...STOCK.map((s) => s[0]),
  ...DEMO_OWNED.map((s) => s[0]),
];

function copyAssets() {
  const uploads = path.join(ROOT, "uploads");
  fs.mkdirSync(uploads, { recursive: true });
  const dir = path.join(ROOT, "seed-assets");
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) fs.copyFileSync(path.join(dir, f), path.join(uploads, `seed-${f}`));
}

const img = (file) => (file ? `/uploads/seed-${file}` : null);
const toDocs = (rows, extra = {}) =>
  rows.map(([skinName, skinRarity, skinPrice, file]) => ({ skinName, skinRarity, skinPrice, skinImage: img(file), ...extra }));

async function reset() {
  await Case.deleteMany({ name: { $in: CASES.map((c) => c.name) } });
  await User.deleteMany({ email: { $in: [ADMIN.email, DEMO.email] } });
  await Skin.deleteMany({ skinName: { $in: seedNames() } });
}

async function seed() {
  const hash = (p) => bcrypt.hash(p, 10);

  const admin = await User.create({ ...ADMIN, password: await hash(ADMIN.password) });
  const demo = await User.create({
    ...DEMO,
    password: await hash(DEMO.password),
    wallet: 1000,
    recharge_history: [{ amount: 1000, date: new Date() }],
  });

  for (const c of CASES) {
    const box = await Case.create({ name: c.name, price: c.price, rarity: c.rarity, expensiveFrom: c.expensiveFrom, skins: [] });
    const skins = await Skin.insertMany(toDocs(c.skins, { owner: "case", caseId: box._id }));
    box.skins = skins.map((s) => s._id);
    await box.save();
  }

  await Skin.insertMany(toDocs(STOCK, { owner: "admin" }));

  const owned = await Skin.insertMany(toDocs(DEMO_OWNED, { owner: "user", ownerUser: demo._id }));
  demo.skins = owned.map((s) => s._id);
  await demo.save();

  return { admin, demo };
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const wantReset = process.argv.includes("--reset");
  const exists = await Case.countDocuments({ name: { $in: CASES.map((c) => c.name) } });

  if (exists && !wantReset) {
    console.log("Demo ma'lumotlar allaqachon bor, o'tkazib yuborildi.");
    console.log("Qayta yaratish uchun: npm run seed -- --reset");
  } else {
    if (wantReset) await reset();
    copyAssets();
    await seed();
    const [users, skins, cases] = await Promise.all([User.countDocuments(), Skin.countDocuments(), Case.countDocuments()]);
    console.log(`Tayyor: ${cases} ta keys, ${skins} ta skin, ${users} ta user.\n`);
    console.log("Admin:  admin@skinmarket.uz  /  Admin123!");
    console.log("User:   demo@skinmarket.uz   /  Demo1234!  (hamyonda $1000)");
    console.log("\nMuhim: ishlab chiqarishda bu parollarni almashtiring!");
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
