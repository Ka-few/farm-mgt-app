import Database from '@tauri-apps/plugin-sql';
import { v4 as uuidv4 } from 'uuid';

let db: Database | null = null;

export const getDb = async () => {
  if (!db) {
    db = await Database.load('sqlite:farm_mgt.db');
  }
  return db;
};

export const initDb = async () => {
  const database = await getDb();
  
  // Migrations / Schema Creation
  await database.execute(`
    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      currency TEXT DEFAULT 'USD',
      setup_complete INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plots (
      id TEXT PRIMARY KEY,
      farm_id TEXT,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('field', 'greenhouse')) NOT NULL,
      size REAL,
      unit TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farm_id) REFERENCES farms(id)
    );

    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      daily_rate REAL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS labor_records (
      id TEXT PRIMARY KEY,
      worker_id TEXT,
      plot_id TEXT,
      activity TEXT,
      date DATE NOT NULL,
      hours REAL,
      amount REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(worker_id) REFERENCES workers(id),
      FOREIGN KEY(plot_id) REFERENCES plots(id)
    );

    CREATE TABLE IF NOT EXISTS livestock (
      id TEXT PRIMARY KEY,
      tag TEXT UNIQUE,
      name TEXT,
      species TEXT CHECK(species IN ('dairy', 'poultry')) NOT NULL,
      breed TEXT,
      dob DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS production_logs (
      id TEXT PRIMARY KEY,
      livestock_id TEXT,
      type TEXT NOT NULL, -- 'milk' or 'eggs'
      quantity REAL NOT NULL,
      unit TEXT,
      recorded_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(livestock_id) REFERENCES livestock(id)
    );

    CREATE TABLE IF NOT EXISTS finance_records (
      id TEXT PRIMARY KEY,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      description TEXT,
      linked_entity_type TEXT,
      linked_entity_id TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database initialized');
};

export const generateId = () => uuidv4();
