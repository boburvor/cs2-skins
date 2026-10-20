const { Router } = require("express");
const {
  getAllCases, getCaseById, createCase, updateCase, deleteCase,
  addSkinToCase, removeSkinFromCase, openCase,
} = require("../controllers/cases.controller");
const { createCaseSchema, updateCaseSchema, caseSkinParamSchema } = require("../validations/case.validation");
const { idParamSchema } = require("../validations/skin.validation");
const validate = require("../middlewares/validate");
const { auth, adminOnly } = require("../middlewares/auth");

const router = Router();

router.get("/", getAllCases);
router.get("/:id", validate(idParamSchema, "params"), getCaseById);

// keys ochish (token kerak)
router.post("/:id/open", auth, validate(idParamSchema, "params"), openCase);

// admin
router.post("/", auth, adminOnly, validate(createCaseSchema), createCase);
router.patch("/:id", auth, adminOnly, validate(idParamSchema, "params"), validate(updateCaseSchema), updateCase);
router.delete("/:id", auth, adminOnly, validate(idParamSchema, "params"), deleteCase);
router.post("/:id/skins/:skinId", auth, adminOnly, validate(caseSkinParamSchema, "params"), addSkinToCase);
router.delete("/:id/skins/:skinId", auth, adminOnly, validate(caseSkinParamSchema, "params"), removeSkinFromCase);

module.exports = router;
