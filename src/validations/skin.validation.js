const Joi = require("joi");

const skinSchema = Joi.object({
  skinName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.base": "Skin nomi matn bo'lishi kerak",
      "string.empty": "Skin nomi bo'sh bo'lishi mumkin emas",
      "string.min": "Skin nomi kamida 2 ta belgidan iborat bo'lishi kerak",
      "string.max": "Skin nomi 100 ta belgidan oshmasligi kerak",
      "any.required": "Skin nomi kiritilishi shart",
    }),

  skinRarity: Joi.string()
    .valid("Common", "Rare", "Epic", "Legendary", "Mythic")
    .required()
    .messages({
      "any.only": "Skin darajasi faqat quyidagilardan biri bo'lishi kerak: Common, Rare, Epic, Legendary, Mythic",
      "any.required": "Skin darajasi kiritilishi shart",
    }),

  skinPrice: Joi.number()
    .positive()
    .min(0.01)
    .required()
    .messages({
      "number.base": "Skin narxi raqam bo'lishi kerak",
      "number.positive": "Skin narxi manfiy bo'lishi mumkin emas! Iltimos, musbat narx kiriting.",
      "number.min": "Skin narxi kamida 0.01 bo'lishi kerak",
      "any.required": "Skin narxi kiritilishi shart",
    }),
});

// PATCH uchun: barcha maydonlar ixtiyoriy
const skinUpdateSchema = skinSchema.fork(
  ["skinName", "skinRarity", "skinPrice"],
  (field) => field.optional()
);

const idParamSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.base": "ID matn bo'lishi kerak",
      "string.hex": "Skin ID formati noto'g'ri! Faqat 16-lik (0-9, a-f) belgilardan iborat bo'lishi kerak.",
      "string.length": "Skin ID uzunligi aynan 24 ta belgidan iborat bo'lishi kerak.",
      "any.required": "Skin ID kiritilishi shart",
    }),
});

module.exports = {
  skinSchema,
  skinUpdateSchema,
  idParamSchema,
};
