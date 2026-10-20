import { useState } from "react";
import { rarityOf } from "../lib/rarity";

// Rasm yo'q skinlar uchun oddiy qurol siluyeti
function Ghost() {
  return (
    <svg className="ghost" viewBox="0 0 200 80" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M8 34h96l8-8h40l6 8h30v10h-24l-6 6h-30l-6 20h-14l4-20H64l-8 8H28l-6-10H8z" />
    </svg>
  );
}

// Oq fonli rasmlar (studiya foto) to'q fonda oq to'rtburchak bo'lib ko'rinmasligi uchun,
// burchaklari oq bo'lsa, rasm ochiq rangli "plita" ustiga qo'yiladi.
const lightCache = new Map();

function isLightPhoto(img) {
  try {
    const size = 16;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);
    return [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]].every(([x, y]) => {
      const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
      return a > 200 && r > 235 && g > 235 && b > 235;
    });
  } catch {
    return false;
  }
}

export default function SkinArt({ skin, className = "" }) {
  const rar = rarityOf(skin?.skinRarity);
  const src = skin?.skinImage;
  const [light, setLight] = useState(() => lightCache.get(src) ?? false);

  const onLoad = (e) => {
    // bir xil rasm bir necha joyda bo'lsa ham hammasi to'g'ri belgilanadi
    if (!lightCache.has(src)) lightCache.set(src, isLightPhoto(e.currentTarget));
    setLight(lightCache.get(src));
  };

  return (
    <div className={`art ${light ? "photo" : ""} ${className}`} style={{ "--rar": rar.color }}>
      {src ? <img src={src} alt={skin.skinName} loading="lazy" draggable="false" onLoad={onLoad} /> : <Ghost />}
    </div>
  );
}
