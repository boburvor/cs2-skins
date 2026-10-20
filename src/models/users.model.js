const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    phone_number: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // bcrypt bilan hash qilingan; oddiy so'rovlarda qaytmaydi
    password: { type: String, required: true, select: false },

    // userdagi skinlarga havola (ID lar), populate() bilan to'liq ma'lumot olinadi
    skins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skin" }],

    wallet: { type: Number, default: 0, min: 0 },

    // hamyon to'ldirishlar tarixi
    recharge_history: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    role: { type: String, enum: ["admin", "user"], default: "user" },
    isBanned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema, "game_users");
