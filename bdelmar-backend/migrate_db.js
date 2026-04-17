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
        console.log("Creating table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS fiscal_config (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                emisor_json     JSON         NOT NULL,
                imprenta_json   JSON         NOT NULL,
                updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log("Inserting default config if missing...");
        await pool.query(`
            INSERT INTO fiscal_config (emisor_json, imprenta_json)
            SELECT
            '{"nombre": "DISTRIBUIDORA Y COMERCIO B-DEL MAR 3011 C.A", "rif": "J-000000000", "domicilio": "Caracas, Venezuela", "telefono": "0424-4293765", "email": "bdelmar69@gmail.com"}',
            '{"nombre": "", "rif": "", "nomenclatura": "", "fechaProvidencia": "", "controlDesde": "00000001", "controlHasta": "00099999", "tasaBCV": "1"}'
            WHERE NOT EXISTS (SELECT 1 FROM fiscal_config LIMIT 1)
        `);

        console.log("Migration successful!");
    } catch(err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
