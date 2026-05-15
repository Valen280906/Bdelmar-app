require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'bdelmar',
    });

    try {
        console.log("Creating videos table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS videos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                video_url VARCHAR(255) NOT NULL,
                subtitle_es_url VARCHAR(255) NULL,
                subtitle_en_url VARCHAR(255) NULL,
                audio_url VARCHAR(255) NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("Videos table created successfully!");
    } catch(err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
