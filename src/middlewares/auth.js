const jwt = require("jsonwebtoken");
const User = require("../models/users.model");

// Token tekshiradi va req.user ni to'ldiradi
const auth = async (req, res, next) => {
  try {
    const [type, token] = (req.headers.authorization || "").split(" ");
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Token yuborilmagan. Header: Authorization: Bearer <token>" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Token yaroqsiz yoki muddati tugagan" });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });
    if (user.isBanned) return res.status(403).json({ message: "Siz bloklangansiz" });

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Bu amal faqat admin uchun" });
  }
  next();
};

// :id o'zimniki yoki admin bo'lsa ruxsat
const selfOrAdmin = (req, res, next) => {
  if (req.user.role === "admin" || String(req.user._id) === req.params.id) return next();
  res.status(403).json({ message: "Bu amal uchun ruxsat yo'q" });
};

module.exports = { auth, adminOnly, selfOrAdmin };
