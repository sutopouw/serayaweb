const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'WT99dVZbbW3Tjmo.root',
  password: '12MC9mgpYStsYkMB',
  database: 'daget_db',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },
  connectTimeout: 30000,
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: true,
  timezone: '+00:00'
};

let pool;

const getDB = () => {
  if (!pool) {
    console.log('Initializing database pool...');
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

module.exports = { getDB }; 