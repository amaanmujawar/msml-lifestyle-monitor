const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const loadSqlStatements = require('./utils/load-sql');

const DATA_ROOT = path.join(__dirname, '..', '..', 'database');

function resolvePath(input, fallback) {
  if (!input) return fallback;
  return path.isAbsolute(input) ? input : path.resolve(__dirname, '..', '..', input);
}

const STORAGE_DIR = resolvePath(process.env.DB_STORAGE_DIR, path.join(DATA_ROOT, 'storage'));
const SQL_DIR = resolvePath(process.env.DB_SQL_DIR, path.join(DATA_ROOT, 'sql'));
const DB_PATH = path.join(STORAGE_DIR, 'lifestyle_monitor.db');
const SQL_SEED_PATH = path.join(SQL_DIR, 'lifestyle_metrics.sql');

fs.mkdirSync(STORAGE_DIR, { recursive: true });
fs.mkdirSync(SQL_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

function seedDatabase() {
  const hasUsersTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .get();

  if (hasUsersTable) {
    return;
  }

  const statements = loadSqlStatements(SQL_SEED_PATH);
  const runAll = db.transaction(() => {
    statements.forEach((statement) => {
      db.prepare(statement).run();
    });
  });

  runAll();
}

seedDatabase();

module.exports = db;
