const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function updateDb() {
    const pool = mysql.createPool({
        host: 'localhost',
        port: 3306,
        database: 'bdelmar',
        user: 'root',
        password: 'And_31856233'
    });

    const adminHash = await bcrypt.hash('AdminBdelmar#2026', 12);
    const userHash = await bcrypt.hash('UserBdelmar$2026', 12);

    await pool.query('UPDATE users SET password = ? WHERE username = ?', [adminHash, 'admin']);
    await pool.query('UPDATE users SET password = ? WHERE username = ?', [userHash, 'user']);

    console.log('Update success');
    process.exit(0);
}

updateDb().catch(console.error);
