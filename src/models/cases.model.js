const mongoose = require("mongoose");
const { DEFAULT_EXPENSIVE_FROM } = require("../config/game");

const caseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    price: { type: Number, required: true, min: 0.01 },
    rarity: {
      type: String,
      required: true,
      enum: ["Common", "Rare", "Epic", "Legendary", "Mythic"],
    },

    // keys ichidagi skinlarga havola (ID lar), populate() bilan to'liq ma'lumot olinadi
    skins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skin" }],

    // narxi shu qiymatdan yuqori skin "qimmat" hisoblanadi
    expensiveFrom: { type: Number, default: DEFAULT_EXPENSIVE_FROM, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Case", caseSchema, "game_cases");
