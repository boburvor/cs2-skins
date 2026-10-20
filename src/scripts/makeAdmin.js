// Ishlatish:  npm run make-admin -- email@example.com
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/users.model");

(async () => {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.log("Ishlatish: npm run make-admin -- email@example.com");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const result = await User.updateOne({ email }, { role: "admin" });
  console.log(result.matchedCount ? `${email} endi admin` : "Bunday email topilmadi (avval ro'yxatdan o'ting)");
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
