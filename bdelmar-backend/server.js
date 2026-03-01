// server.js – Backend stub para B DEL MAR 3011
// Instalar con: npm install express cors pg dotenv
// Ejecutar con: node server.js

const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

// === Conexión PostgreSQL ===
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'bdelmar',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
})

// === Rutas de Tema ===

// GET /api/theme → retorna la configuración activa
app.get('/api/theme', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM theme_config ORDER BY updated_at DESC LIMIT 1'
        )
        if (result.rows.length === 0) {
            return res.json({ success: true, data: null })
        }
        const row = result.rows[0]
        res.json({
            success: true,
            data: {
                id: row.id,
                palettes: row.palette_json,
                typography: row.typography_json,
                mode: row.active_mode,
            }
        })
    } catch (err) {
        console.error('GET /api/theme error:', err.message)
        res.status(500).json({ success: false, error: err.message })
    }
})

// POST /api/theme → guarda la configuración
app.post('/api/theme', async (req, res) => {
    const { palettes, typography, mode } = req.body
    try {
        // Upsert: si existe, actualiza; si no, inserta
        const existing = await pool.query('SELECT id FROM theme_config LIMIT 1')
        let result
        if (existing.rows.length > 0) {
            result = await pool.query(
                `UPDATE theme_config
         SET palette_json = $1, typography_json = $2, active_mode = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
                [JSON.stringify(palettes), JSON.stringify(typography), mode, existing.rows[0].id]
            )
        } else {
            result = await pool.query(
                `INSERT INTO theme_config (palette_json, typography_json, active_mode)
         VALUES ($1, $2, $3)
         RETURNING *`,
                [JSON.stringify(palettes), JSON.stringify(typography), mode]
            )
        }
        res.json({ success: true, data: result.rows[0] })
    } catch (err) {
        console.error('POST /api/theme error:', err.message)
        res.status(500).json({ success: false, error: err.message })
    }
})

// Healthcheck
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'B DEL MAR 3011 API' }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`\nB DEL MAR 3011 API corriendo en http://localhost:${PORT}`)
    console.log(`→ GET  /api/theme    – obtener configuración de tema`)
    console.log(`→ POST /api/theme    – guardar configuración de tema`)
    console.log(`→ GET  /api/health   – estado del servidor\n`)
})
