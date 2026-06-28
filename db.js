import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define DB path
const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.db');

// Connect to SQLite DB (creates file if it doesn't exist)
const db = new DatabaseSync(dbPath);

// Initialize schemas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log(`Database initialized successfully at: ${dbPath}`);

export default db;
