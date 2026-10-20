const fs = require("fs");
const errorHandler = (err, req, res, next) => {
  // Dasturchilar uchun konsolda xatolikni ko'rsatish
  console.error("Xatolik tafsiloti:", err);
  if (req.file) fs.promises.unlink(req.file.path).catch(() => {});  
  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Rasm hajmi 5MB dan oshmasligi kerak"
        : "Fayl yuklashda xatolik";
    return res.status(400).json({ message });
  }

  // 1. JSON formati buzilgan bo'lsa (masalan, noto'g'ri vergul yoki qavs)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Yuborilgan ma'lumotlar (JSON) formati noto'g'ri. Iltimos, belgilarni tekshiring.",
    });
  }

  // 2. Mongoose CastError (masalan, ID yoki qiymat formati noto'g'ri bo'lsa)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: `Kiritilgan ma'lumot formati noto'g'ri: ${err.path || "ID"}`,
    });
  }

  // 3. Mongoose takroriy ma'lumot xatosi (Duplicate Key - 11000)
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({
      message: duplicateField
        ? `Bu ${duplicateField} allaqachon mavjud, iltimos boshqa nom tanlang.`
        : "Bu ma'lumot tizimda allaqachon mavjud.",
    });
  }

  // 4. Mongoose validatsiya xatosi
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      message: "Ma'lumotlar talabga to'liq mos kelmadi.",
      errors: messages,
    });
  }

  // 5. Umumiy / Kutilmagan server xatoligi (500)
  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500
      ? "Serverda kutilmagan nosozlik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring."
      : err.message || "Xatolik yuz berdi";

  res.status(statusCode).json({
    message,
  });
};

module.exports = errorHandler;
