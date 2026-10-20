# SkinMarket (9-lesson-cases)

Express + MongoDB backend va React frontend: keys ochish, bozor, hamyon, inventar va admin panel.

## Tez boshlash
```bash
npm run setup          # backend va frontend paketlarini o'rnatadi
```
1. `.env` faylini tayyorlang (`.env.example` dan nusxa oling): `MONGODB_URI` va `JWT_SECRET`.
2. Baza: Atlas yoki lokal MongoDB (quyida).
3. Demo ma'lumotlarni yuklang: `npm run seed`
4. Ishga tushiring: `npm run dev:all`, so'ng brauzerda **http://localhost:5173**

Seed yaratadigan hisoblar:

| Rol | Email | Parol |
|---|---|---|
| Admin | admin@skinmarket.uz | Admin123! |
| User (hamyonda $1000) | demo@skinmarket.uz | Demo1234! |

Ishlab chiqarishda bu parollarni almashtiring. `npm run seed -- --reset` demo ma'lumotlarni o'chirib, qaytadan yaratadi.

## Baza
- **Atlas:** `.env` ga `MONGODB_URI=mongodb+srv://...` yozing.
- **Lokal (Docker):** `docker compose up -d`, so'ng `.env` da `MONGODB_URI=mongodb://127.0.0.1:27017/skinmarket`.

Kolleksiyalar: `skins` (eski skinlaringiz ham shu yerda, ular bozorda "omborda" bo'lib ko'rinadi), `game_users`, `game_cases`. Keys va userlar alohida kolleksiyada turgani uchun eski keys ma'lumotlari bilan aralashmaydi.

## Skriptlar
| Buyruq | Vazifasi |
|---|---|
| `npm run dev:all` | backend (5432) va frontend (5173) birga |
| `npm run dev` / `npm run client` | alohida ishga tushirish |
| `npm run seed` | demo ma'lumotlar |
| `npm run make-admin -- email` | mavjud userni admin qilish |
| `npm run build:client` va `npm start` | bitta server (http://localhost:5432) |

**Drop qoidasi:** keys ochilganda 25% ehtimol bilan QIMMAT skin (narxi >= keysning `expensiveFrom` qiymati), 75% ehtimol bilan ARZON skin tushadi. Sozlamalar: `src/config/game.js`.

## Skin egalari (`owner` maydoni)
| owner | ma'nosi |
|---|---|
| `admin` | admin omborida, sotuvda (buySkin mumkin) |
| `case` | keys ichida (faqat keys ochganda tushadi) |
| `user` | userda (`ownerUser` = egasi) |

## API
**Skins** (oldingidek): `GET /api/skins` (`?owner=admin|user|case`), `GET /:id`, `POST`, `PUT /:id`, `PATCH /:id`, `PATCH /:id/image`, `DELETE /:id`

**Users**
| Metod | Manzil | Kim |
|---|---|---|
| POST | `/api/users` | hamma (create / register) |
| POST | `/api/users/login` | hamma |
| GET | `/api/users/me` | token |
| POST | `/api/users/me/wallet` `{ "amount": 500 }` | token (hamyon to'ldirish) |
| POST | `/api/users/me/buy/:skinId` | token (buySkin) |
| POST | `/api/users/me/sell/:skinId` | token (sellSkin) |
| POST | `/api/users/me/withdraw/:skinId` | token (withdraw) |
| GET | `/api/users` | admin |
| GET | `/api/users/:id` | o'zi yoki admin |
| PATCH | `/api/users/:id` | o'zi yoki admin (update; `role` faqat admin) |
| PATCH | `/api/users/:id/ban` `{ "isBanned": true }` | admin |
| DELETE | `/api/users/:id` | o'zi yoki admin |

**Cases**
| Metod | Manzil | Kim |
|---|---|---|
| GET | `/api/cases`, `/api/cases/:id` | hamma |
| POST | `/api/cases/:id/open` | token (keys ochish) |
| POST | `/api/cases` `{ name, price, rarity, skins: [id...], expensiveFrom }` | admin |
| PATCH | `/api/cases/:id` | admin |
| DELETE | `/api/cases/:id` | admin |
| POST / DELETE | `/api/cases/:id/skins/:skinId` | admin (keysga skin qo'shish / olish) |

## PowerShell misol
```powershell
$base = "http://localhost:5432/api"
$r = Invoke-RestMethod "$base/users/login" -Method Post -ContentType "application/json" `
  -Body (@{ email = "ilhom@mail.com"; password = "secret1" } | ConvertTo-Json)
$h = @{ Authorization = "Bearer $($r.token)" }

Invoke-RestMethod "$base/users/me/wallet" -Method Post -Headers $h -ContentType "application/json" `
  -Body (@{ amount = 500 } | ConvertTo-Json)
Invoke-RestMethod "$base/cases/<CASE_ID>/open" -Method Post -Headers $h
```

## Frontend (client/ papkasi)
React + Vite. Sahifalar: Keyslar (keys ochish lentasi), Bozor, Inventar, Hamyon/Profil, Kirish, Ro'yxatdan o'tish va Admin panel (skinlar, keyslar, userlar). Dev rejimda Vite `/api` va `/uploads` so'rovlarini backend'ga yo'naltiradi.

Eslatmalar:
- Keys ichidagi "25%" yozuvi `client/src/lib/rarity.js` dagi `EXPENSIVE_CHANCE` dan olinadi. `src/config/game.js` da foizni o'zgartirsangiz, shu yerda ham o'zgartiring.
- Oq fonli skin rasmlari ochiq "plita" ustida, shaffof PNG esa to'q fonda ko'rsatiladi (avtomatik aniqlanadi).
- Keys ichidagi skinlar tushgach kamayadi. Admin panelda keysga yangi skin qo'shib turing.
- Port 5432 band bo'lsa, server aniq xabar bilan to'xtaydi (eski serverni yoping).
