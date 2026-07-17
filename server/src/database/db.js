import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper to convert SQLite ? to Postgres $1, $2, etc.
function convertQuery(sql) {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

const dbWrapper = {
  async run(sql, params = []) {
    const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
    let pgSql = convertQuery(sql);
    
    if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
      pgSql += ' RETURNING id';
    }

    const res = await pool.query(pgSql, params);
    
    let lastInsertRowid = null;
    if (res.rows && res.rows.length > 0 && res.rows[0].id) {
      lastInsertRowid = res.rows[0].id;
    }
    
    return { lastInsertRowid, changes: res.rowCount };
  },

  async get(sql, params = []) {
    const pgSql = convertQuery(sql);
    const res = await pool.query(pgSql, params);
    return res.rows[0] || null;
  },

  async all(sql, params = []) {
    const pgSql = convertQuery(sql);
    const res = await pool.query(pgSql, params);
    return res.rows;
  },

  async transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Temporarily override methods for the transaction block
      const tempDb = {
        run: async (s, p) => {
           const isInsert = s.trim().toUpperCase().startsWith('INSERT');
           let pgSql = convertQuery(s);
           if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
             pgSql += ' RETURNING id';
           }
           const res = await client.query(pgSql, p);
           return { lastInsertRowid: res.rows[0]?.id || null, changes: res.rowCount };
        },
        get: async (s, p) => (await client.query(convertQuery(s), p)).rows[0],
        all: async (s, p) => (await client.query(convertQuery(s), p)).rows
      };
      
      const result = await fn(tempDb);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async exec(sql) {
    // Basic execution for schema initialization
    return await pool.query(sql);
  }
};

export default dbWrapper;
