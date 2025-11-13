const fs = require('fs');

/**
 * Reads a SQL seed file and returns executable statements.
 * Splits on semicolons that close a statement while being
 * tolerant of blank lines and comments.
 */
function loadSqlStatements(filePath) {
  const sql = fs.readFileSync(filePath, 'utf-8');

  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length && !statement.startsWith('--'));
}

module.exports = loadSqlStatements;
