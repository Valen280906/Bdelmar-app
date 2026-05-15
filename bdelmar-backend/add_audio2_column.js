require('dotenv').config()
const mysql = require('mysql2/promise')

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'bdelmar',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  })

  try {
    // Verificar si ya existe la columna
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'videos' AND COLUMN_NAME = 'audio_url_2'`,
      [process.env.DB_NAME || 'bdelmar']
    )

    if (rows.length > 0) {
      console.log('✅ La columna audio_url_2 ya existe. Nada que hacer.')
    } else {
      await pool.query(
        'ALTER TABLE videos ADD COLUMN audio_url_2 VARCHAR(255) NULL AFTER audio_url'
      )
      console.log('✅ Columna audio_url_2 añadida correctamente a la tabla videos.')
    }
  } catch (err) {
    console.error('❌ Error en migración:', err.message)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

migrate()
