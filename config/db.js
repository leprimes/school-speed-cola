// hootie edit
// ./config/db.js
const mysql = require("mysql2/promise");

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

let pool = null;

async function initDb() {
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error("Missing env vars: DB_HOST, DB_USER, DB_NAME");
  }

  // Connect WITHOUT a database first (so we can create it if missing)
  const bootstrap = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    connectTimeout: 15000,
  });

  try {
    const escapedDbName = mysql.escapeId(DB_NAME);
    await bootstrap.query(`CREATE DATABASE IF NOT EXISTS ${escapedDbName}`);
    console.log(`✅ Database ensured: ${DB_NAME}`);
  } finally {
    await bootstrap.end();
  }

  // Now create the pooled connection USING the database
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 15000,
  });

  // Quick connectivity test (don't crash EB if it fails)
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log("✅ Conectado a la base de datos (pool listo)");
  } catch (err) {
    console.error("❌ Pool created but connection test failed:", err);
  }

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error("DB pool not initialized. Call initDb() first.");
  }
  return pool;
}

module.exports = { initDb, getPool };
