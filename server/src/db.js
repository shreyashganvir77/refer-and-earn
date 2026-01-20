const sql = require('mssql');

// Azure SQL configuration – replace with your actual values or env vars.
// Prefer pulling these from process.env in production.
const config = {
  user: process.env.DB_USER || 'username',
  password: process.env.DB_PASSWORD || 'password',
  server: process.env.DB_SERVER || 'your_server.database.windows.net',
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME || 'AdventureWorksLT',
  authentication: {
    type: 'default',
  },
  options: {
    encrypt: true, // required for Azure SQL
  },
};

let poolPromise;

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config);
  }
  return poolPromise;
}

module.exports = {
  sql,
  getPool,
};

