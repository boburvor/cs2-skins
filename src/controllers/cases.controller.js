const Case = require("../models/cases.model");
const Skin = require("../models/skins.model");
const User = require("../models/users.model");
const { EXPENSIVE_CHANCE } = require("../config/game");
const { IN_STOCK, round2, randomInt, rollChance } = require("../utils/helpers");

// GET /api/cases
exports.getAllCases = async (req, res, next) => {
  try {
    const cases = await Case.find().populate("skins");
    res.status(200).json(cases);
  } catch (error) {
    next(error);
  }
};

// GET /api/cases/:id
exports.getCaseById = async (req, res, next) => {
  try {
    const box = await Case.findById(req.params.id).populate("skins");
    if (!box) return res.status(404).json({ message: "Keys topilmadi" });
    res.status(200).json(box);
  } catch (error) {
    next(error);
  }
};

// POST /api/cases  (admin)  skins: admin omboridagi skin ID lari
exports.createCase = async (req, res, next) => {
  try {
    const { skins = [], ...rest } = req.body;
    const ids = [...new Set(skins.map(String))];

    if (ids.length) {
      const found = await Skin.countDocuments({ _id: { $in: ids }, ...IN_STOCK });
      if (found !== ids.length) {
        return res.status(400).json({ message: "Ba'zi skinlar topilmadi yoki admin omborida emas (band)" });
      }
    }

    const box = await Case.create({ ...rest, skins: ids });
    if (ids.length) {
      await Skin.updateMany(
        { _id: { $in: ids }, ...IN_STOCK },
        { owner: "case", ownerUser: null, caseId: box._id }
      );
    }

    res.status(201).json(await box.populate("skins"));
  } catch (error) {
    next(error);
  }
};

// PATCH /api/cases/:id  (admin)
exports.updateCase = async (req, res, next) => {
  try {
    const box = await Case.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    }).populate("skins");
    if (!box) return res.status(404).json({ message: "Keys topilmadi" });
    res.status(200).json(box);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cases/:id  (admin)  ichidagi skinlar admin omboriga qaytadi
exports.deleteCase = async (req, res, next) => {
  try {
    const box = await Case.findByIdAndDelete(req.params.id);
    if (!box) return res.status(404).json({ message: "Keys topilmadi" });

    await Skin.updateMany({ caseId: box._id, owner: "case" }, { owner: "admin", caseId: null });
    res.status(200).json({ message: "Keys o'chirildi, skinlar admin omboriga qaytdi" });
  } catch (error) {
    next(error);
  }
};

// POST /api/cases/:id/skins/:skinId  (admin)  keysga skin qo'shish
exports.addSkinToCase = async (req, res, next) => {
  try {
    const { id, skinId } = req.params;

    const box = await Case.findById(id);
    if (!box) return res.status(404).json({ message: "Keys topilmadi" });

    const skin = await Skin.findOneAndUpdate(
      { _id: skinId, ...IN_STOCK },
      { owner: "case", ownerUser: null, caseId: box._id },
      { returnDocument: "after" }
    );
    if (!skin) return res.status(400).json({ message: "Skin topilmadi yoki admin omborida emas (band)" });

    await Case.updateOne({ _id: id }, { $addToSet: { skins: skin._id } });
    res.status(200).json(await Case.findById(id).populate("skins"));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cases/:id/skins/:skinId  (admin)  keysdan skinni olib tashlash
exports.removeSkinFromCase = async (req, res, next) => {
  try {
    const { id, skinId } = req.params;

    const skin = await Skin.findOneAndUpdate(
      { _id: skinId, owner: "case", caseId: id },
      { owner: "admin", caseId: null },
      { returnDocument: "after" }
    );
    if (!skin) return res.status(404).json({ message: "Bu skin shu keys ichida yo'q" });

    await Case.updateOne({ _id: id }, { $pull: { skins: skin._id } });
    res.status(200).json(await Case.findById(id).populate("skins"));
  } catch (error) {
    next(error);
  }
};

// POST /api/cases/:id/open  (keys ochish)
// Drop: 25% ehtimol bilan QIMMAT skin (narxi >= expensiveFrom), 75% ARZON skin
exports.openCase = async (req, res, next) => {
  let charged = false;
  let price = 0;

  try {
    const box = await Case.findById(req.params.id);
    if (!box) return res.status(404).json({ message: "Keys topilmadi" });

    price = round2(box.price);

    // 1. keys narxi hamyondan yechiladi (balans yetarli bo'lsagina)
    const paid = await User.updateOne(
      { _id: req.user._id, wallet: { $gte: price } },
      { $inc: { wallet: -price } }
    );
    if (paid.matchedCount === 0) {
      return res.status(400).json({ message: "Hamyonda mablag' yetarli emas", wallet: req.user.wallet, price });
    }
    charged = true;

    // 2. drop: tier tanlanadi, keyin shu tierdan tasodifiy skin
    let won = null;
    let tier = null;

    for (let attempt = 0; attempt < 5 && !won; attempt++) {
      const pool = await Skin.find({ caseId: box._id, owner: "case" });
      if (pool.length === 0) break;

      const expensive = pool.filter((s) => s.skinPrice >= box.expensiveFrom);
      const cheap = pool.filter((s) => s.skinPrice < box.expensiveFrom);

      const wantExpensive = rollChance(EXPENSIVE_CHANCE);
      let list = wantExpensive ? expensive : cheap;
      if (list.length === 0) list = wantExpensive ? cheap : expensive; // tier bo'sh bo'lsa, ikkinchisidan

      const pick = list[randomInt(list.length)];

      // skinni egallaymiz (kimdir oldinroq olgan bo'lsa, qayta urinamiz)
      won = await Skin.findOneAndUpdate(
        { _id: pick._id, owner: "case", caseId: box._id },
        { owner: "user", ownerUser: req.user._id, caseId: null },
        { returnDocument: "after" }
      );
      if (won) tier = pick.skinPrice >= box.expensiveFrom ? "expensive" : "cheap";
    }

    if (!won) {
      await User.updateOne({ _id: req.user._id }, { $inc: { wallet: price } });
      charged = false;
      return res.status(409).json({ message: "Keys ichida skin qolmagan, pul qaytarildi" });
    }

    // skin berildi, endi xato bo'lsa ham pul qaytarilmaydi
    charged = false;

    await Promise.all([
      User.updateOne({ _id: req.user._id }, { $addToSet: { skins: won._id } }),
      Case.updateOne({ _id: box._id }, { $pull: { skins: won._id } }),
    ]);

    res.status(200).json({
      message: tier === "expensive" ? "Tabriklaymiz! Qimmat skin tushdi!" : "Yangi skin tushdi",
      tier,
      skin: won,
      wallet: (await User.findById(req.user._id)).wallet,
    });
  } catch (error) {
    // xato bo'lsa, yechilgan pul qaytariladi
    if (charged) await User.updateOne({ _id: req.user._id }, { $inc: { wallet: price } }).catch(() => {});
    next(error);
  }
};
