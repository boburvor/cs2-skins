const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users.model");
const Skin = require("../models/skins.model");
const { SELL_RATE } = require("../config/game");
const { IN_STOCK, round2 } = require("../utils/helpers");

const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(".env faylida JWT_SECRET yo'q");
  }
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// foydalanuvchining hozirgi hamyon qiymati
const getWallet = async (id) => (await User.findById(id)).wallet;

// POST /api/users  (create / ro'yxatdan o'tish)
exports.createUser = async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ ...rest, password: hashed });
    res.status(201).json({ user, token: signToken(user) });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ message: "Email yoki parol noto'g'ri" });
    if (user.isBanned) return res.status(403).json({ message: "Siz bloklangansiz" });

    res.status(200).json({ user, token: signToken(user) });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("skins");
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// GET /api/users  (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id  (o'zi yoki admin)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("skins");
    if (!user) return res.status(404).json({ message: "User topilmadi" });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id  (update: o'zi yoki admin)
exports.updateUser = async (req, res, next) => {
  try {
    const data = { ...req.body };

    if (data.role && req.user.role !== "admin") {
      return res.status(403).json({ message: "Rolni faqat admin o'zgartira oladi" });
    }
    if (data.password) data.password = await bcrypt.hash(data.password, 10);

    const result = await User.updateOne({ _id: req.params.id }, data, { runValidators: true });
    if (result.matchedCount === 0) return res.status(404).json({ message: "User topilmadi" });

    res.status(200).json(await User.findById(req.params.id));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id  (o'zi yoki admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User topilmadi" });

    await User.deleteOne({ _id: user._id });

    // userda qolgan skinlar admin omboriga qaytadi (withdraw qilinganlari qaytmaydi)
    await Skin.updateMany(
      { ownerUser: user._id, isWithdrawn: { $ne: true } },
      { owner: "admin", ownerUser: null, caseId: null }
    );

    res.status(200).json({ message: "User o'chirildi" });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/ban  (admin)  body: { "isBanned": true | false }  (default: true)
exports.banUser = async (req, res, next) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: "O'zingizni bloklay olmaysiz" });
    }

    const isBanned = req.body?.isBanned ?? true;
    const result = await User.updateOne({ _id: req.params.id }, { isBanned });
    if (result.matchedCount === 0) return res.status(404).json({ message: "User topilmadi" });

    const user = await User.findById(req.params.id);
    res.status(200).json({ message: isBanned ? "User bloklandi" : "User blokdan chiqarildi", user });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/me/wallet  body: { "amount": 500 }
exports.rechargeWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { wallet: amount }, $push: { recharge_history: { amount, date: new Date() } } }
    );
    const user = await User.findById(req.user._id);
    res.status(200).json({ message: `Hamyon ${amount}$ ga to'ldirildi`, wallet: user.wallet, recharge_history: user.recharge_history });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/me/buy/:skinId  (admin omboridagi skinni sotib olish)
exports.buySkin = async (req, res, next) => {
  try {
    const { skinId } = req.params;

    const skin = await Skin.findOne({ _id: skinId, ...IN_STOCK });
    if (!skin) return res.status(404).json({ message: "Skin sotuvda yo'q yoki topilmadi" });

    const price = round2(skin.skinPrice);

    // 1. balans yetarli bo'lsagina pul yechiladi
    const paid = await User.updateOne(
      { _id: req.user._id, wallet: { $gte: price } },
      { $inc: { wallet: -price } }
    );
    if (paid.matchedCount === 0) {
      return res.status(400).json({ message: "Hamyonda mablag' yetarli emas", wallet: req.user.wallet, price });
    }

    // 2. skin egallanadi (boshqa kishi oldin olgan bo'lsa, pul qaytariladi)
    const claimed = await Skin.findOneAndUpdate(
      { _id: skinId, ...IN_STOCK },
      { owner: "user", ownerUser: req.user._id, caseId: null },
      { returnDocument: "after" }
    );
    if (!claimed) {
      await User.updateOne({ _id: req.user._id }, { $inc: { wallet: price } });
      return res.status(409).json({ message: "Skin allaqachon sotilgan, pul qaytarildi" });
    }

    await User.updateOne({ _id: req.user._id }, { $addToSet: { skins: claimed._id } });
    res.status(200).json({ message: "Skin sotib olindi", skin: claimed, wallet: await getWallet(req.user._id) });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/me/sell/:skinId  (skinni sotib, pulini hamyonga olish)
exports.sellSkin = async (req, res, next) => {
  try {
    const { skinId } = req.params;

    const claimed = await Skin.findOneAndUpdate(
      { _id: skinId, owner: "user", ownerUser: req.user._id, isWithdrawn: { $ne: true } },
      { owner: "admin", ownerUser: null, caseId: null },
      { returnDocument: "after" }
    );
    if (!claimed) {
      return res.status(404).json({ message: "Bu skin sizda yo'q yoki allaqachon yechib olingan" });
    }

    const amount = round2(claimed.skinPrice * SELL_RATE);
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { wallet: amount }, $pull: { skins: claimed._id } }
    );

    res.status(200).json({ message: `Skin ${amount}$ ga sotildi`, skin: claimed, wallet: await getWallet(req.user._id) });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/me/withdraw/:skinId  (skinni saytdan yechib olish)
exports.withdrawSkin = async (req, res, next) => {
  try {
    const skin = await Skin.findOneAndUpdate(
      { _id: req.params.skinId, owner: "user", ownerUser: req.user._id, isWithdrawn: { $ne: true } },
      { isWithdrawn: true, withdrawnAt: new Date() },
      { returnDocument: "after" }
    );
    if (!skin) {
      return res.status(404).json({ message: "Bu skin sizda yo'q yoki allaqachon yechib olingan" });
    }

    res.status(200).json({ message: "Skin yechib olindi (withdraw)", skin });
  } catch (error) {
    next(error);
  }
};
