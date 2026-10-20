const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // kengaytma mijoz nomidan emas, tur bo'yicha qo'yiladi
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${EXT[file.mimetype]}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (EXT[file.mimetype]) return cb(null, true);
  const err = new Error("Faqat rasm (JPG, PNG, WEBP) yuklash mumkin");
  err.statusCode = 400;
  cb(err);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Fayl ichidagi haqiqiy belgilarni (magic bytes) tekshiradi
const detectType = (b) => {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP")
    return "image/webp";
  return null;
};

const verifyImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const fh = await fs.promises.open(req.file.path, "r");
    const buf = Buffer.alloc(12);
    await fh.read(buf, 0, 12, 0);
    await fh.close();

    const type = detectType(buf);
    if (!type) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      const err = new Error("Yuborilgan fayl rasm emas");
      err.statusCode = 400;
      return next(err);
    }

    // haqiqiy turga mos kengaytma
    const correctPath = req.file.path.replace(/\.[^.]+$/, EXT[type]);
    if (correctPath !== req.file.path) {
      await fs.promises.rename(req.file.path, correctPath);
      req.file.path = correctPath;
      req.file.filename = path.basename(correctPath);
    }
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = upload;
module.exports.verifyImage = verifyImage;
