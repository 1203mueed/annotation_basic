const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'annotation_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'annotation_db',
  password: process.env.DB_PASSWORD || 'mueed',
  port: process.env.DB_PORT || 5432
});

module.exports = pool;
