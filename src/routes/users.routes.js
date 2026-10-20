const { Router } = require("express");
const {
  createUser, login, getMe, getAllUsers, getUserById, updateUser, deleteUser,
  banUser, rechargeWallet, buySkin, sellSkin, withdrawSkin,
} = require("../controllers/users.controller");
const {
  createUserSchema, loginSchema, updateUserSchema, rechargeSchema, banSchema, skinIdParamSchema,
} = require("../validations/user.validation");
const { idParamSchema } = require("../validations/skin.validation");
const validate = require("../middlewares/validate");
const { auth, adminOnly, selfOrAdmin } = require("../middlewares/auth");

const router = Router();

// ochiq
router.post("/", validate(createUserSchema), createUser);          // create (ro'yxatdan o'tish)
router.post("/login", validate(loginSchema), login);

// o'z profilim va o'yin amallari (token kerak). /me/... route'lari /:id dan oldin turishi shart
router.get("/me", auth, getMe);
router.post("/me/wallet", auth, validate(rechargeSchema), rechargeWallet);
router.post("/me/buy/:skinId", auth, validate(skinIdParamSchema, "params"), buySkin);
router.post("/me/sell/:skinId", auth, validate(skinIdParamSchema, "params"), sellSkin);
router.post("/me/withdraw/:skinId", auth, validate(skinIdParamSchema, "params"), withdrawSkin);

// admin
router.get("/", auth, adminOnly, getAllUsers);
router.patch("/:id/ban", auth, adminOnly, validate(idParamSchema, "params"), validate(banSchema), banUser);

// o'zi yoki admin
router.get("/:id", auth, validate(idParamSchema, "params"), selfOrAdmin, getUserById);
router.patch("/:id", auth, validate(idParamSchema, "params"), selfOrAdmin, validate(updateUserSchema), updateUser);
router.delete("/:id", auth, validate(idParamSchema, "params"), selfOrAdmin, deleteUser);

module.exports = router;
