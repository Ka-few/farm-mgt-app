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
            quantity INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS production_logs (
            id TEXT PRIMARY KEY,
            livestock_id TEXT,
            type TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT,
            morning_qty REAL,
            noon_qty REAL,
            evening_qty REAL,
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

        CREATE TABLE IF NOT EXISTS weeding_records (
            id TEXT PRIMARY KEY,
            crop_id TEXT,
            mode TEXT NOT NULL,
            herbicide_name TEXT,
            date DATE NOT NULL,
            cost REAL DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(crop_id) REFERENCES crops(id)
        );

        CREATE TABLE IF NOT EXISTS harvest_records (
            id TEXT PRIMARY KEY,
            crop_id TEXT,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            harvest_date DATE NOT NULL,
            cost REAL DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(crop_id) REFERENCES crops(id)
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

    // Add session columns if they don't exist (handle legacy databases)
    let _ = conn.execute(
        "ALTER TABLE production_logs ADD COLUMN morning_qty REAL",
        [],
    );
    let _ = conn.execute("ALTER TABLE production_logs ADD COLUMN noon_qty REAL", []);
    let _ = conn.execute(
        "ALTER TABLE production_logs ADD COLUMN evening_qty REAL",
        [],
    );

    let _ = conn.execute(
        "ALTER TABLE livestock ADD COLUMN quantity INTEGER DEFAULT 1",
        [],
    );

    // Add default planting areas to prevent foreign key errors and provide generic options
    let _ = conn.execute(
        "INSERT OR IGNORE INTO plots (id, name, type, size, unit) VALUES ('greenhouse', 'General Greenhouse', 'greenhouse', 0, 'Sq Meters')",
        [],
    );
    let _ = conn.execute(
        "INSERT OR IGNORE INTO plots (id, name, type, size, unit) VALUES ('open_field', 'General Open Field', 'field', 0, 'Acres')",
        [],
    );

    conn
}
