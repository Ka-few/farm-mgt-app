use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::AppHandle;
use tauri::Manager;

pub struct DbState(pub Mutex<Connection>);

pub fn get_db_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("Could not get app data dir")
        .join("farm_mgt.db")
}

pub fn establish_connection(app: &AppHandle) -> Connection {
    let path = get_db_path(app);

    // Ensure the parent directory exists
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).expect("Failed to create app data directory");
        }
    }

    let conn = Connection::open(path).expect("Failed to open database");

    // Initialize schema
    conn.execute_batch("
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
            species TEXT CHECK(species IN ('dairy', 'poultry', 'beef', 'pigs', 'goats', 'sheep')) NOT NULL,
            breed TEXT,
            dob DATE,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS production_logs (
            id TEXT PRIMARY KEY,
            livestock_id TEXT,
            type TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT,
            recorded_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(livestock_id) REFERENCES livestock(id)
        );

        CREATE TABLE IF NOT EXISTS health_records (
            id TEXT PRIMARY KEY,
            livestock_id TEXT,
            record_date DATE NOT NULL,
            record_type TEXT NOT NULL,
            description TEXT,
            cost REAL,
            next_visit DATE,
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

        CREATE TABLE IF NOT EXISTS crops (
            id TEXT PRIMARY KEY,
            plot_id TEXT,
            name TEXT NOT NULL,
            variety TEXT,
            phase TEXT,
            planting_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(plot_id) REFERENCES plots(id)
        );

        CREATE TABLE IF NOT EXISTS irrigation_records (
            id TEXT PRIMARY KEY,
            plot_id TEXT,
            method TEXT,
            source TEXT,
            duration_minutes INTEGER,
            water_used_litres REAL,
            date DATE NOT NULL,
            cost REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(plot_id) REFERENCES plots(id)
        );

        CREATE TABLE IF NOT EXISTS audit_events (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            action TEXT NOT NULL,
            payload TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ").expect("Failed to initialize database schema");

    conn
}
