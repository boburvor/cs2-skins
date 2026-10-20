const mongoose = require("mongoose");

const skinSchema = new mongoose.Schema({
  skinName: {
    type: String,
    required: true,
  },

  skinRarity: {
    type: String,
    required: true,
    enum: ["Common", "Rare", "Epic", "Legendary", "Mythic"],
  },

  skinPrice: {
    type: Number,
    required: true,
  },

  skinImage: {
    type: String,
    default: null,
  },

  // Skin hozir kimda: admin omborida, keys ichida yoki userda
  owner: {
    type: String,
    enum: ["admin", "user", "case"],
    default: "admin",
  },

  // owner = "user" bo'lsa, egasi
  ownerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  // owner = "case" bo'lsa, qaysi keys ichida
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Case",
    default: null,
  },

  // withdraw qilingan (Steam'ga chiqarib olingan) skin
  isWithdrawn: {
    type: Boolean,
    default: false,
  },

  withdrawnAt: {
    type: Date,
    default: null,
  },
});

const Skin = mongoose.model("Skin", skinSchema);

module.exports = Skin;
