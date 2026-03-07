const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function updateDb() {
    const pool = mysql.createPool({
        host: 'localhost',
        port: 3306,
        database: 'bdelmar',
        user: 'root',
        password: 'perla1505'
    });

    const adminHash = await bcrypt.hash('AdminBdelmar#2026', 12);
    const userHash = await bcrypt.hash('UserBdelmar$2026', 12);

    await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password)',
        ['admin', 'admin@bdelmar.com', adminHash, 'admin']
    );
    await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password)',
        ['user', 'user@bdelmar.com', userHash, 'user']
    );

    console.log('Update success');
    process.exit(0);
}

updateDb().catch(console.error);
