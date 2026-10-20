const Joi = require("joi");
const { DEFAULT_EXPENSIVE_FROM } = require("../config/game");

const objectId = Joi.string().hex().length(24);
const rarity = Joi.string().valid("Common", "Rare", "Epic", "Legendary", "Mythic");

const createCaseSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  price: Joi.number().positive().max(100000).required(),
  rarity: rarity.required(),
  skins: Joi.array().items(objectId).unique().default([]),
  expensiveFrom: Joi.number().min(0).default(DEFAULT_EXPENSIVE_FROM),
});

const updateCaseSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  price: Joi.number().positive().max(100000),
  rarity,
  expensiveFrom: Joi.number().min(0),
})
  .min(1)
  .required()
  .messages({
    "object.min": "O'zgartirish uchun kamida bitta maydon yuboring",
    "any.required": "O'zgartirish uchun ma'lumot yuboring",
  });

// /:id/skins/:skinId
const caseSkinParamSchema = Joi.object({
  id: objectId.required(),
  skinId: objectId.required(),
});

module.exports = { createCaseSchema, updateCaseSchema, caseSkinParamSchema };
