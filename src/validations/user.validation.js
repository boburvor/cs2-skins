const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    "string.min": "Ism kamida 2 ta belgidan iborat bo'lishi kerak",
    "any.required": "Ism kiritilishi shart",
  }),
  phone_number: Joi.string().pattern(/^\+?[0-9]{9,15}$/).required().messages({
    "string.pattern.base": "Telefon raqam noto'g'ri (masalan: +998901234567)",
    "any.required": "Telefon raqam kiritilishi shart",
  }),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required().messages({
    "string.email": "Email formati noto'g'ri",
    "any.required": "Email kiritilishi shart",
  }),
  password: Joi.string().min(6).max(64).required().messages({
    "string.min": "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
    "any.required": "Parol kiritilishi shart",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().required(),
  password: Joi.string().required(),
});

// PATCH uchun: hamma maydon ixtiyoriy, lekin kamida bittasi bo'lishi kerak
const updateUserSchema = createUserSchema
  .fork(["name", "phone_number", "email", "password"], (f) => f.optional())
  .keys({ role: Joi.string().valid("user", "admin") })
  .min(1)
  .required()
  .messages({
    "object.min": "O'zgartirish uchun kamida bitta maydon yuboring",
    "any.required": "O'zgartirish uchun ma'lumot yuboring",
  });

const rechargeSchema = Joi.object({
  amount: Joi.number().positive().max(100000).precision(2).required().messages({
    "number.positive": "Summa 0 dan katta bo'lishi kerak",
    "any.required": "Summa (amount) kiritilishi shart",
  }),
}).required();

const banSchema = Joi.object({
  isBanned: Joi.boolean(),
});

const skinIdParamSchema = Joi.object({
  skinId: objectId.required().messages({
    "string.hex": "Skin ID formati noto'g'ri",
    "string.length": "Skin ID uzunligi 24 ta belgi bo'lishi kerak",
  }),
});

module.exports = {
  createUserSchema,
  loginSchema,
  updateUserSchema,
  rechargeSchema,
  banSchema,
  skinIdParamSchema,
};
