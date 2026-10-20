const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const connectDB = require('./config/db')
const skinsRouter = require('./routes/skins.routes')
const usersRouter = require('./routes/users.routes')
const casesRouter = require('./routes/cases.routes')
const notFound = require('./middlewares/notFound')
const errorHandler = require('./middlewares/errorHandler')

if (!process.env.JWT_SECRET) {
    console.warn("OGOHLANTIRISH: .env faylida JWT_SECRET yo'q. Login va token ishlamaydi!")
}

const app = express()
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

app.use('/api/skins', skinsRouter)
app.use('/api/users', usersRouter)
app.use('/api/cases', casesRouter)

// Frontend (client papkasi): `npm run build:client` dan keyin shu yerdan xizmat qilinadi
const clientDist = path.join(__dirname, '../client/dist')
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist))
    app.get('/{*splat}', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next()
        res.sendFile(path.join(clientDist, 'index.html'))
    })
} else {
    app.get('/', (req, res) => {
        res.send("Hello, World!")
    })
}

// Mavjud bo'lmagan barcha manzillar uchun (404)
app.use(notFound)

// Global xatoliklarni ushlovchi middleware (eng oxirida bo'lishi shart)
app.use(errorHandler)

const PORT = process.env.PORT || 5432;

const startServer = async () => {
    await connectDB()

    app.listen(PORT, (err) => {
        if (err) {
            console.error(`${PORT}-port band yoki xato:`, err.message)
            process.exit(1)
        }
        console.log(`Server ishladi: port ${PORT}  Skins: /api/skins  Users: /api/users  Cases: /api/cases`);
    })
}

startServer()
