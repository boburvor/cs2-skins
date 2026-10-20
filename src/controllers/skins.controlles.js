const fs = require('fs');
const path = require('path');
const Skin = require('../models/skins.model');
const User = require('../models/users.model');
const Case = require('../models/cases.model');
const { IN_STOCK } = require('../utils/helpers');

// uploads papkadagi rasmni o'chiradi (fayl yo'q bo'lsa xato bermaydi)
const removeImage = async (imagePath) => {
    if (!imagePath) return;
    await fs.promises.unlink(path.join(__dirname, "../..", imagePath)).catch(() => {});
};

// Yuklangan faylni o'chiradi (so'rov bekor bo'lganda)
const removeUploaded = async (file) => {
    if (file) await fs.promises.unlink(file.path).catch(() => {});
};

// GET /api/skins            (hammasi)
// GET /api/skins?owner=admin (faqat sotuvdagi skinlar; user | case ham bo'ladi)
exports.getAllSkins = async (req, res, next) => {
    try {
        const { owner } = req.query;
        let filter = {};
        if (owner === 'admin') filter = IN_STOCK;
        else if (owner === 'user' || owner === 'case') filter = { owner };

        const skins = await Skin.find(filter);
        res.status(200).json(skins);
    } catch (error) {
        next(error);
    }
};

// GET /api/skins/:id
exports.getSkinById = async (req, res, next) => {
    try {
        const skin = await Skin.findById(req.params.id);

        if (!skin) {
            return res.status(404).json({ message: "Skin topilmadi" });
        }

        res.status(200).json(skin);
    } catch (error) {
        next(error);
    }
};

// POST /api/skins
exports.createSkin = async (req, res, next) => {
    try {
        const newSkin = new Skin({
            ...req.body,
            skinImage: req.file ? `/uploads/${req.file.filename}` : null,
        });
        const savedSkin = await newSkin.save();
        res.status(201).json(savedSkin);
    } catch (error) {
        next(error);
    }
};

// PUT va PATCH /api/skins/:id
// Yangi rasm kelsa, eskisi uploads papkadan o'chib, o'rniga yangisi qo'yiladi.
// Rasm kelmasa, eski rasm o'zgarishsiz qoladi.
exports.updateSkin = async (req, res, next) => {
    try {
        const skin = await Skin.findById(req.params.id);

        if (!skin) {
            await removeUploaded(req.file);
            return res.status(404).json({ message: "Skin topilmadi" });
        }

        const data = req.body || {};

        if (Object.keys(data).length === 0 && !req.file) {
            return res.status(400).json({ message: "O'zgartirish uchun ma'lumot yoki rasm yuboring" });
        }

        const oldImage = skin.skinImage;

        skin.set(data);
        if (req.file) {
            skin.skinImage = `/uploads/${req.file.filename}`;
        }
        await skin.save();

        // yangisi saqlangandan keyingina eskisi o'chadi
        if (req.file) {
            await removeImage(oldImage);
        }

        res.status(200).json(skin);
    } catch (error) {
        next(error);
    }
};

// PATCH /api/skins/:id/image (faqat rasmni almashtirish)
exports.updateSkinImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Rasm yuborilmadi" });
        }

        const skin = await Skin.findById(req.params.id);

        if (!skin) {
            await removeUploaded(req.file);
            return res.status(404).json({ message: "Skin topilmadi" });
        }

        const oldImage = skin.skinImage;

        skin.skinImage = `/uploads/${req.file.filename}`;
        await skin.save();

        await removeImage(oldImage);

        res.status(200).json(skin);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/skins/:id
exports.deleteSkin = async (req, res, next) => {
    try {
        const { id } = req.params;
        const skin = await Skin.findByIdAndDelete(id);

        if (!skin) {
            return res.status(404).json({ message: "Skin topilmadi" });
        }

        await removeImage(skin.skinImage);

        // userlar va keyslardagi havolalarni ham tozalaymiz
        await User.updateMany({ skins: skin._id }, { $pull: { skins: skin._id } });
        await Case.updateMany({ skins: skin._id }, { $pull: { skins: skin._id } });

        res.status(200).json({ message: "Skin muvaffaqiyatli o'chirildi" });
    } catch (error) {
        next(error);
    }
};
