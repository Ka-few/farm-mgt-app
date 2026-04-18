use crate::db::DbState;
use crate::models::{
    Attendance, Budget, BudgetItem, Crop, CropCycle, CropStage, Customer, DailyLog, Farm,
    FinanceRecord, Input, InputUsage, IrrigationRecord, Order, Payroll, Plot, Task, Worker,
    YieldRecord,
};
use rusqlite::{params, OptionalExtension};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_workers(state: State<DbState>) -> Result<Vec<Worker>, String> {
    get_workers_logic(&state)
}

pub fn get_workers_logic(db: &DbState) -> Result<Vec<Worker>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name, role, daily_rate, is_active, created_at FROM workers ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let worker_iter = stmt
        .query_map([], |row| {
            Ok(Worker {
                id: row.get(0)?,
                name: row.get(1)?,
                role: row.get(2)?,
                daily_rate: row.get(3)?,
                is_active: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut workers = Vec::new();
    for worker in worker_iter {
        workers.push(worker.map_err(|e| e.to_string())?);
    }

    Ok(workers)
}

#[tauri::command]
pub fn add_worker(
    state: State<DbState>,
    name: String,
    role: String,
    daily_rate: f64,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO workers (id, name, role, daily_rate) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, role, daily_rate],
    )
    .map_err(|e| e.to_string())?;

    // Log audit event (simplified for now)
    let audit_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO audit_events (id, entity_type, entity_id, action, payload) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![audit_id, "workers", id, "create", format!("{{\"name\": \"{}\"}}", name)],
    ).map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub fn record_labor(
    state: State<DbState>,
    worker_id: String,
    plot_id: Option<String>,
    activity: String,
    date: String,
    amount: f64,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();

    // Use a transaction for atomic labor log + finance entry
    // Wait, rusqlite transactions are tricky with Mutex<Connection> if not handled carefully,
    // but here we have the lock so we are safe.

    conn.execute(
        "INSERT INTO labor_records (id, worker_id, plot_id, activity, date, amount) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, worker_id, plot_id, activity, date, amount],
    ).map_err(|e| e.to_string())?;

    // Finance Record
    let finance_id = Uuid::new_v4().to_string();
    let description = format!("Labor: {} by {}", activity, worker_id);
    conn.execute(
        "INSERT INTO finance_records (id, type, category, amount, date, description, linked_entity_type, linked_entity_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![finance_id, "expense", "Labor", amount, date, description, "labor_records", id],
    ).map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub fn get_labor_logs(state: State<DbState>) -> Result<Vec<serde_json::Value>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("
        SELECT l.id, l.worker_id, w.name as worker_name, l.plot_id, p.name as plot_name, l.activity, l.date, l.amount, l.created_at
        FROM labor_records l
        LEFT JOIN workers w ON l.worker_id = w.id
        LEFT JOIN plots p ON l.plot_id = p.id
        ORDER BY l.date DESC
    ").map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "worker_id": row.get::<_, String>(1)?,
                "worker_name": row.get::<_, Option<String>>(2)?,
                "plot_id": row.get::<_, Option<String>>(3)?,
                "plot_name": row.get::<_, Option<String>>(4)?,
                "activity": row.get::<_, String>(5)?,
                "date": row.get::<_, String>(6)?,
                "amount": row.get::<_, f64>(7)?,
                "created_at": row.get::<_, String>(8)?
            }))
        })
        .map_err(|e| e.to_string())?;

    let mut logs = Vec::new();
    for row in rows {
        logs.push(row.map_err(|e| e.to_string())?);
    }
    Ok(logs)
}

// --- Plot & Crop Commands ---

#[tauri::command]
pub fn get_plots(state: State<DbState>) -> Result<Vec<Plot>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, farm_id, name, type, size, unit, created_at FROM plots ORDER BY name ASC",
        )
        .map_err(|e| e.to_string())?;

    let plot_iter = stmt
        .query_map([], |row| {
            Ok(Plot {
                id: row.get(0)?,
                farm_id: row.get(1)?,
                name: row.get(2)?,
                plot_type: row.get(3)?,
                size: row.get(4)?,
                unit: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut plots = Vec::new();
    for plot in plot_iter {
        plots.push(plot.map_err(|e| e.to_string())?);
    }
    Ok(plots)
}

#[tauri::command]
pub fn add_plot(
    state: State<DbState>,
    farm_id: Option<String>,
    name: String,
    plot_type: String,
    size: f64,
    unit: String,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO plots (id, farm_id, name, type, size, unit) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, farm_id, name, plot_type, size, unit],
    )
    .map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn get_crops(state: State<DbState>) -> Result<Vec<Crop>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("
        SELECT c.id, c.plot_id, p.name as plot_name, c.name, c.variety, c.phase, c.planting_date, c.created_at 
        FROM crops c
        LEFT JOIN plots p ON c.plot_id = p.id
        ORDER BY planting_date DESC
    ")
        .map_err(|e| e.to_string())?;

    let crop_iter = stmt
        .query_map([], |row| {
            Ok(Crop {
                id: row.get(0)?,
                plot_id: row.get(1)?,
                plot_name: row.get(2)?,
                name: row.get(3)?,
                variety: row.get(4)?,
                phase: row.get(5)?,
                planting_date: row.get(6)?,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut crops = Vec::new();
    for crop in crop_iter {
        crops.push(crop.map_err(|e| e.to_string())?);
    }
    Ok(crops)
}

#[tauri::command]
pub fn add_crop(
    state: State<DbState>,
    plot_id: String,
    name: String,
    variety: String,
    date: String,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO crops (id, plot_id, name, variety, phase, planting_date) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, plot_id, name, variety, "Planting", date],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

// --- Weeding Commands ---

#[tauri::command]
pub fn add_weeding_record(
    state: State<DbState>,
    crop_id: String,
    mode: String,
    herbicide_name: Option<String>,
    date: String,
    cost: f64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO weeding_records (id, crop_id, mode, herbicide_name, date, cost, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, crop_id, mode, herbicide_name, date, cost, notes],
    ).map_err(|e| e.to_string())?;

    if cost > 0.0 {
        let finance_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO finance_records (id, type, category, amount, date, description, linked_entity_type, linked_entity_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![finance_id, "expense", "Crop Inputs", cost, date, format!("Weeding ({})", mode), "weeding_records", id],
        ).ok();
    }

    Ok(id)
}

#[tauri::command]
pub fn get_weeding_records(
    state: State<DbState>,
    crop_id: Option<String>,
) -> Result<Vec<serde_json::Value>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let sql = if crop_id.is_some() {
        "SELECT w.id, w.crop_id, c.name as crop_name, w.mode, w.herbicide_name, w.date, w.cost, w.notes, w.created_at FROM weeding_records w LEFT JOIN crops c ON w.crop_id = c.id WHERE w.crop_id = ?1 ORDER BY w.date DESC"
    } else {
        "SELECT w.id, w.crop_id, c.name as crop_name, w.mode, w.herbicide_name, w.date, w.cost, w.notes, w.created_at FROM weeding_records w LEFT JOIN crops c ON w.crop_id = c.id ORDER BY w.date DESC"
    };

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

    let rows = if let Some(cid) = crop_id {
        stmt.query_map(params![cid], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "crop_id": row.get::<_, Option<String>>(1)?,
                "crop_name": row.get::<_, Option<String>>(2)?,
                "mode": row.get::<_, String>(3)?,
                "herbicide_name": row.get::<_, Option<String>>(4)?,
                "date": row.get::<_, String>(5)?,
                "cost": row.get::<_, f64>(6)?,
                "notes": row.get::<_, Option<String>>(7)?,
                "created_at": row.get::<_, String>(8)?
            }))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect()
    } else {
        stmt.query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "crop_id": row.get::<_, Option<String>>(1)?,
                "crop_name": row.get::<_, Option<String>>(2)?,
                "mode": row.get::<_, String>(3)?,
                "herbicide_name": row.get::<_, Option<String>>(4)?,
                "date": row.get::<_, String>(5)?,
                "cost": row.get::<_, f64>(6)?,
                "notes": row.get::<_, Option<String>>(7)?,
                "created_at": row.get::<_, String>(8)?
            }))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect()
    };

    Ok(rows)
}

#[tauri::command]
pub fn delete_weeding_record(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM weeding_records WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_weeding_record(
    state: State<DbState>,
    id: String,
    crop_id: String,
    mode: String,
    herbicide_name: Option<String>,
    date: String,
    cost: f64,
    notes: Option<String>,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE weeding_records SET crop_id = ?1, mode = ?2, herbicide_name = ?3, date = ?4, cost = ?5, notes = ?6 WHERE id = ?7",
        params![crop_id, mode, herbicide_name, date, cost, notes, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

// --- Harvest Commands ---

#[tauri::command]
pub fn add_harvest_record(
    state: State<DbState>,
    crop_id: String,
    quantity: f64,
    unit: String,
    harvest_date: String,
    cost: f64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO harvest_records (id, crop_id, quantity, unit, harvest_date, cost, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, crop_id, quantity, unit, harvest_date, cost, notes],
    ).map_err(|e| e.to_string())?;

    if cost > 0.0 {
        let finance_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO finance_records (id, type, category, amount, date, description, linked_entity_type, linked_entity_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![finance_id, "expense", "Crop Inputs", cost, harvest_date, "Harvesting costs", "harvest_records", id],
        ).ok();
    }

    Ok(id)
}

#[tauri::command]
pub fn get_harvest_records(
    state: State<DbState>,
    crop_id: Option<String>,
) -> Result<Vec<serde_json::Value>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let sql = if crop_id.is_some() {
        "SELECT h.id, h.crop_id, c.name as crop_name, h.quantity, h.unit, h.harvest_date, h.cost, h.notes, h.created_at FROM harvest_records h LEFT JOIN crops c ON h.crop_id = c.id WHERE h.crop_id = ?1 ORDER BY h.harvest_date DESC"
    } else {
        "SELECT h.id, h.crop_id, c.name as crop_name, h.quantity, h.unit, h.harvest_date, h.cost, h.notes, h.created_at FROM harvest_records h LEFT JOIN crops c ON h.crop_id = c.id ORDER BY h.harvest_date DESC"
    };

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

    let records = if let Some(cid) = crop_id {
        stmt.query_map(params![cid], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "crop_id": row.get::<_, Option<String>>(1)?,
                "crop_name": row.get::<_, Option<String>>(2)?,
                "quantity": row.get::<_, f64>(3)?,
                "unit": row.get::<_, String>(4)?,
                "harvest_date": row.get::<_, String>(5)?,
                "cost": row.get::<_, f64>(6)?,
                "notes": row.get::<_, Option<String>>(7)?,
                "created_at": row.get::<_, String>(8)?
            }))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect()
    } else {
        stmt.query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "crop_id": row.get::<_, Option<String>>(1)?,
                "crop_name": row.get::<_, Option<String>>(2)?,
                "quantity": row.get::<_, f64>(3)?,
                "unit": row.get::<_, String>(4)?,
                "harvest_date": row.get::<_, String>(5)?,
                "cost": row.get::<_, f64>(6)?,
                "notes": row.get::<_, Option<String>>(7)?,
                "created_at": row.get::<_, String>(8)?
            }))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect()
    };

    Ok(records)
}

#[tauri::command]
pub fn delete_harvest_record(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM harvest_records WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_harvest_record(
    state: State<DbState>,
    id: String,
    crop_id: String,
    quantity: f64,
    unit: String,
    harvest_date: String,
    cost: f64,
    notes: Option<String>,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE harvest_records SET crop_id = ?1, quantity = ?2, unit = ?3, harvest_date = ?4, cost = ?5, notes = ?6 WHERE id = ?7",
        params![crop_id, quantity, unit, harvest_date, cost, notes, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn record_irrigation(
    state: State<DbState>,
    plot_id: String,
    method: String,
    source: String,
    duration: i32,
    water_used: f64,
    date: String,
    cost: f64,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO irrigation_records (id, plot_id, method, source, duration_minutes, water_used_litres, date, cost) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, plot_id, method, source, duration, water_used, date, cost],
    ).map_err(|e| e.to_string())?;

    if cost > 0.0 {
        let finance_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO finance_records (id, type, category, amount, date, description, linked_entity_type, linked_entity_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![finance_id, "expense", "Utilities", cost, date, "Irrigation costs", "irrigation_records", id],
        ).map_err(|e| e.to_string())?;
    }

    Ok(id)
}

#[tauri::command]
pub fn get_irrigation_records(state: State<DbState>) -> Result<Vec<IrrigationRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("
        SELECT i.id, i.plot_id, p.name as plot_name, i.method, i.source, i.duration_minutes, i.water_used_litres, i.date, i.cost, i.created_at 
        FROM irrigation_records i
        LEFT JOIN plots p ON i.plot_id = p.id
        ORDER BY date DESC
    ")
        .map_err(|e| e.to_string())?;

    let record_iter = stmt
        .query_map([], |row| {
            Ok(IrrigationRecord {
                id: row.get(0)?,
                plot_id: row.get(1)?,
                plot_name: row.get(2)?,
                method: row.get(3)?,
                source: row.get(4)?,
                duration_minutes: row.get(5)?,
                water_used_litres: row.get(6)?,
                date: row.get(7)?,
                cost: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut records = Vec::new();
    for record in record_iter {
        records.push(record.map_err(|e| e.to_string())?);
    }
    Ok(records)
}

// --- Livestock Commands ---

#[tauri::command]
pub fn get_livestock(state: State<DbState>) -> Result<Vec<crate::models::Livestock>, String> {
    get_livestock_logic(&state)
}

pub fn get_livestock_logic(db: &DbState) -> Result<Vec<crate::models::Livestock>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, tag, name, species, breed, dob, status, quantity, created_at FROM livestock ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let livestock_iter = stmt
        .query_map([], |row| {
            Ok(crate::models::Livestock {
                id: row.get(0)?,
                tag: row.get(1)?,
                name: row.get(2)?,
                species: row.get(3)?,
                breed: row.get(4)?,
                dob: row.get(5)?,
                status: row.get(6)?,
                quantity: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in livestock_iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn add_livestock(
    state: State<DbState>,
    tag: String,
    name: String,
    species: String,
    breed: String,
    dob: String,
    quantity: Option<i32>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let qty = quantity.unwrap_or(1);
    conn.execute(
        "INSERT INTO livestock (id, tag, name, species, breed, dob, quantity) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, tag, name, species, breed, dob, qty],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn update_livestock(
    state: State<DbState>,
    id: String,
    tag: String,
    name: String,
    species: String,
    breed: String,
    dob: String,
    status: String,
    quantity: Option<i32>,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let qty = quantity.unwrap_or(1);
    conn.execute(
        "UPDATE livestock SET tag = ?1, name = ?2, species = ?3, breed = ?4, dob = ?5, status = ?6, quantity = ?7 WHERE id = ?8",
        params![tag, name, species, breed, dob, status, qty, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_livestock(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM livestock WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_health_records(
    state: State<DbState>,
    livestock_id: Option<String>,
) -> Result<Vec<crate::models::HealthRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let mut records = Vec::new();

    if let Some(lid) = livestock_id {
        let mut stmt = conn.prepare("
            SELECT h.id, h.livestock_id, l.tag, l.name, h.record_date, h.record_type, h.description, h.cost, h.next_visit, h.created_at 
            FROM health_records h
            LEFT JOIN livestock l ON h.livestock_id = l.id
            WHERE h.livestock_id = ?1 
            ORDER BY record_date DESC
        ").map_err(|e| e.to_string())?;
        let record_iter = stmt
            .query_map(params![lid], |row| {
                Ok(crate::models::HealthRecord {
                    id: row.get(0)?,
                    livestock_id: row.get(1)?,
                    livestock_tag: row.get(2)?,
                    livestock_name: row.get(3)?,
                    record_date: row.get(4)?,
                    record_type: row.get(5)?,
                    description: row.get(6)?,
                    cost: row.get(7)?,
                    next_visit: row.get(8)?,
                    created_at: row.get(9)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for record in record_iter {
            records.push(record.map_err(|e| e.to_string())?);
        }
    } else {
        let mut stmt = conn.prepare("
            SELECT h.id, h.livestock_id, l.tag, l.name, h.record_date, h.record_type, h.description, h.cost, h.next_visit, h.created_at 
            FROM health_records h
            LEFT JOIN livestock l ON h.livestock_id = l.id
            ORDER BY record_date DESC
        ").map_err(|e| e.to_string())?;
        let record_iter = stmt
            .query_map([], |row| {
                Ok(crate::models::HealthRecord {
                    id: row.get(0)?,
                    livestock_id: row.get(1)?,
                    livestock_tag: row.get(2)?,
                    livestock_name: row.get(3)?,
                    record_date: row.get(4)?,
                    record_type: row.get(5)?,
                    description: row.get(6)?,
                    cost: row.get(7)?,
                    next_visit: row.get(8)?,
                    created_at: row.get(9)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for record in record_iter {
            records.push(record.map_err(|e| e.to_string())?);
        }
    }

    Ok(records)
}

#[tauri::command]
pub fn add_health_record(
    state: State<DbState>,
    livestock_id: String,
    record_date: String,
    record_type: String,
    description: String,
    cost: f64,
    next_visit: Option<String>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO health_records (id, livestock_id, record_date, record_type, description, cost, next_visit) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, livestock_id, record_date, record_type, description, cost, next_visit],
    ).map_err(|e| e.to_string())?;

    if cost > 0.0 {
        let finance_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO finance_records (id, type, category, amount, date, description, linked_entity_type, linked_entity_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![finance_id, "expense", "Livestock Health", cost, record_date, format!("Health: {} for {}", record_type, livestock_id), "health_records", id],
        ).ok();
    }

    Ok(id)
}

#[tauri::command]
pub fn record_production(
    state: State<DbState>,
    livestock_id: Option<String>,
    production_type: String,
    quantity: f64,
    unit: String,
    morning_qty: Option<f64>,
    noon_qty: Option<f64>,
    evening_qty: Option<f64>,
    recorded_at: String,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO production_logs (id, livestock_id, type, quantity, unit, morning_qty, noon_qty, evening_qty, recorded_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![id, livestock_id, production_type, quantity, unit, morning_qty, noon_qty, evening_qty, recorded_at],
    ).map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub fn update_production(
    state: State<DbState>,
    id: String,
    livestock_id: Option<String>,
    production_type: String,
    quantity: f64,
    unit: String,
    morning_qty: Option<f64>,
    noon_qty: Option<f64>,
    evening_qty: Option<f64>,
    recorded_at: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE production_logs SET livestock_id = ?1, type = ?2, quantity = ?3, unit = ?4, morning_qty = ?5, noon_qty = ?6, evening_qty = ?7, recorded_at = ?8 WHERE id = ?9",
        params![livestock_id, production_type, quantity, unit, morning_qty, noon_qty, evening_qty, recorded_at, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_production(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM production_logs WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn record_milk(
    state: State<DbState>,
    livestock_id: Option<String>,
    quantity: f64,
    morning_qty: Option<f64>,
    noon_qty: Option<f64>,
    evening_qty: Option<f64>,
    recorded_at: String,
) -> Result<String, String> {
    record_production(
        state,
        livestock_id,
        "milk".to_string(),
        quantity,
        "L".to_string(),
        morning_qty,
        noon_qty,
        evening_qty,
        recorded_at,
    )
}

#[tauri::command]
pub fn get_production_logs(
    state: State<DbState>,
    prod_type: Option<String>,
) -> Result<Vec<crate::models::ProductionLog>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let mut logs = Vec::new();

    if let Some(pt) = prod_type {
        let mut stmt = conn.prepare("
            SELECT p.id, p.livestock_id, l.tag, l.name, p.type, p.quantity, p.unit, p.morning_qty, p.noon_qty, p.evening_qty, p.recorded_at, p.created_at 
            FROM production_logs p
            LEFT JOIN livestock l ON p.livestock_id = l.id
            WHERE p.type = ?1 
            ORDER BY recorded_at DESC
        ").map_err(|e| e.to_string())?;
        let logs_iter = stmt
            .query_map(params![pt], |row| {
                Ok(crate::models::ProductionLog {
                    id: row.get(0)?,
                    livestock_id: row.get(1)?,
                    livestock_tag: row.get(2)?,
                    livestock_name: row.get(3)?,
                    production_type: row.get(4)?,
                    quantity: row.get(5)?,
                    unit: row.get(6)?,
                    morning_qty: row.get(7)?,
                    noon_qty: row.get(8)?,
                    evening_qty: row.get(9)?,
                    recorded_at: row.get(10)?,
                    created_at: row.get(11)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for log in logs_iter {
            logs.push(log.map_err(|e| e.to_string())?);
        }
    } else {
        let mut stmt = conn.prepare("
            SELECT p.id, p.livestock_id, l.tag, l.name, p.type, p.quantity, p.unit, p.morning_qty, p.noon_qty, p.evening_qty, p.recorded_at, p.created_at 
            FROM production_logs p
            LEFT JOIN livestock l ON p.livestock_id = l.id
            ORDER BY recorded_at DESC
        ").map_err(|e| e.to_string())?;
        let logs_iter = stmt
            .query_map([], |row| {
                Ok(crate::models::ProductionLog {
                    id: row.get(0)?,
                    livestock_id: row.get(1)?,
                    livestock_tag: row.get(2)?,
                    livestock_name: row.get(3)?,
                    production_type: row.get(4)?,
                    quantity: row.get(5)?,
                    unit: row.get(6)?,
                    morning_qty: row.get(7)?,
                    noon_qty: row.get(8)?,
                    evening_qty: row.get(9)?,
                    recorded_at: row.get(10)?,
                    created_at: row.get(11)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for log in logs_iter {
            logs.push(log.map_err(|e| e.to_string())?);
        }
    }

    Ok(logs)
}

#[tauri::command]
pub fn get_production_summary(state: State<DbState>, start_date: String) -> Result<f64, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT SUM(quantity) FROM production_logs WHERE recorded_at >= ?1")
        .map_err(|e| e.to_string())?;

    let total: Option<f64> = stmt
        .query_row(params![start_date], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    Ok(total.unwrap_or(0.0))
}

// --- Finance Commands ---

#[tauri::command]
pub fn get_finance_summary(
    state: State<DbState>,
    start_date: String,
) -> Result<serde_json::Value, String> {
    get_finance_summary_logic(&state, start_date)
}

pub fn get_finance_summary_logic(
    db: &DbState,
    start_date: String,
) -> Result<serde_json::Value, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT type, SUM(amount) FROM finance_records WHERE date >= ?1 AND is_deleted = 0 GROUP BY type")
        .map_err(|e| e.to_string())?;

    let mut income = 0.0;
    let mut expenses = 0.0;

    let mut rows = stmt.query(params![start_date]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let t: String = row.get(0).map_err(|e| e.to_string())?;
        let val: f64 = row.get(1).map_err(|e| e.to_string())?;
        if t == "income" {
            income = val;
        } else {
            expenses = val;
        }
    }

    Ok(serde_json::json!({
        "income": income,
        "expenses": expenses,
        "balance": income - expenses
    }))
}

#[tauri::command]
pub fn get_finance_records(state: State<DbState>) -> Result<Vec<FinanceRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, type, category, amount, date, description, linked_entity_type, linked_entity_id, is_deleted, created_at FROM finance_records WHERE is_deleted = 0 ORDER BY date DESC")
        .map_err(|e| e.to_string())?;

    let record_iter = stmt
        .query_map([], |row| {
            Ok(FinanceRecord {
                id: row.get(0)?,
                record_type: row.get(1)?,
                category: row.get(2)?,
                amount: row.get(3)?,
                date: row.get(4)?,
                description: row.get(5)?,
                linked_entity_type: row.get(6)?,
                linked_entity_id: row.get(7)?,
                is_deleted: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut records = Vec::new();
    for record in record_iter {
        records.push(record.map_err(|e| e.to_string())?);
    }
    Ok(records)
}

#[tauri::command]
pub fn add_finance_record(
    state: State<DbState>,
    record_type: String,
    category: String,
    amount: f64,
    date: String,
    description: String,
    linked_entity_type: Option<String>,
    linked_entity_id: Option<String>,
) -> Result<String, String> {
    add_finance_record_logic(
        &state,
        record_type,
        category,
        amount,
        date,
        description,
        linked_entity_type,
        linked_entity_id,
    )
}

pub fn add_finance_record_logic(
    db: &DbState,
    record_type: String,
    category: String,
    amount: f64,
    date: String,
    description: String,
    linked_entity_type: Option<String>,
    linked_entity_id: Option<String>,
) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO finance_records (id, type, category, amount, date, description, linked_entity_type, linked_entity_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, record_type, category, amount, date, description, linked_entity_type, linked_entity_id],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

// --- Farm Profile Commands ---

#[tauri::command]
pub fn get_farm(state: State<DbState>) -> Result<Option<Farm>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, currency, setup_complete, created_at FROM farms LIMIT 1")
        .map_err(|e| e.to_string())?;

    let mut farm_iter = stmt
        .query_map([], |row| {
            Ok(Farm {
                id: row.get(0)?,
                name: row.get(1)?,
                currency: row.get(2)?,
                setup_complete: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    if let Some(farm_res) = farm_iter.next() {
        let farm = farm_res.map_err(|e| e.to_string())?;
        Ok(Some(farm))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn update_farm(
    state: State<DbState>,
    id: Option<String>,
    name: String,
    currency: String,
) -> Result<String, String> {
    let conn = state
        .0
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    // If id is provided, update that specific farm
    if let Some(existing_id) = id {
        conn.execute(
            "UPDATE farms SET name = ?1, currency = ?2 WHERE id = ?3",
            params![name, currency, existing_id],
        )
        .map_err(|e| format!("Failed to update farm profile: {}", e))?;
        Ok(existing_id)
    } else {
        // If ID is missing, check if we already have a farm record
        let mut stmt = conn
            .prepare("SELECT id FROM farms LIMIT 1")
            .map_err(|e| e.to_string())?;
        let existing_id: Option<String> = stmt
            .query_row([], |row| row.get::<_, String>(0))
            .optional()
            .map_err(|e| e.to_string())?;

        if let Some(eid) = existing_id {
            // Update the existing one instead of inserting a second one
            conn.execute(
                "UPDATE farms SET name = ?1, currency = ?2 WHERE id = ?3",
                params![name, currency, eid],
            )
            .map_err(|e| format!("Failed to update existing farm: {}", e))?;
            Ok(eid)
        } else {
            // No farm exists, create the first one
            let new_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO farms (id, name, currency, setup_complete) VALUES (?1, ?2, ?3, 1)",
                params![new_id, name, currency],
            )
            .map_err(|e| format!("Failed to create farm profile: {}", e))?;
            Ok(new_id)
        }
    }
}

// --- Delete & Update Commands ---

#[tauri::command]
pub fn delete_worker(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM workers WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_worker(
    state: State<DbState>,
    id: String,
    name: String,
    role: String,
    daily_rate: f64,
    is_active: i32,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE workers SET name = ?1, role = ?2, daily_rate = ?3, is_active = ?4 WHERE id = ?5",
        params![name, role, daily_rate, is_active, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_plot(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM plots WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_plot(
    state: State<DbState>,
    id: String,
    name: String,
    plot_type: String,
    size: f64,
    unit: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE plots SET name = ?1, type = ?2, size = ?3, unit = ?4 WHERE id = ?5",
        params![name, plot_type, size, unit, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_crop(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM crops WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_crop(
    state: State<DbState>,
    id: String,
    name: String,
    variety: String,
    phase: String,
    date: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE crops SET name = ?1, variety = ?2, phase = ?3, planting_date = ?4 WHERE id = ?5",
        params![name, variety, phase, date, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_irrigation_record(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    // Also delete linked finance record
    conn.execute("DELETE FROM finance_records WHERE linked_entity_type = 'irrigation_records' AND linked_entity_id = ?1", params![id]).ok();
    conn.execute("DELETE FROM irrigation_records WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_finance_record(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM finance_records WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_finance_record(
    state: State<DbState>,
    id: String,
    record_type: String,
    category: String,
    amount: f64,
    date: String,
    description: String,
    linked_entity_type: Option<String>,
    linked_entity_id: Option<String>,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE finance_records SET type = ?1, category = ?2, amount = ?3, date = ?4, description = ?5, linked_entity_type = ?6, linked_entity_id = ?7 WHERE id = ?8",
        params![record_type, category, amount, date, description, linked_entity_type, linked_entity_id, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_milk_records(
    state: State<DbState>,
) -> Result<Vec<crate::models::ProductionLog>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("
        SELECT p.id, p.livestock_id, l.tag, l.name, p.type, p.quantity, p.unit, p.morning_qty, p.noon_qty, p.evening_qty, p.recorded_at, p.created_at 
        FROM production_logs p
        LEFT JOIN livestock l ON p.livestock_id = l.id
        WHERE p.type = 'milk' 
        ORDER BY recorded_at DESC 
        LIMIT 50
    ").map_err(|e| e.to_string())?;

    let logs_iter = stmt
        .query_map([], |row| {
            Ok(crate::models::ProductionLog {
                id: row.get(0)?,
                livestock_id: row.get(1)?,
                livestock_tag: row.get(2)?,
                livestock_name: row.get(3)?,
                production_type: row.get(4)?,
                quantity: row.get(5)?,
                unit: row.get(6)?,
                morning_qty: row.get(7)?,
                noon_qty: row.get(8)?,
                evening_qty: row.get(9)?,
                recorded_at: row.get(10)?,
                created_at: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut logs = Vec::new();
    for log in logs_iter {
        logs.push(log.map_err(|e| e.to_string())?);
    }
    Ok(logs)
}

#[tauri::command]
pub fn delete_milk_record(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM production_logs WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_milk_record(
    state: State<DbState>,
    id: String,
    quantity: f64,
    morning_qty: Option<f64>,
    noon_qty: Option<f64>,
    evening_qty: Option<f64>,
    recorded_at: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE production_logs SET quantity = ?1, morning_qty = ?2, noon_qty = ?3, evening_qty = ?4, recorded_at = ?5 WHERE id = ?6",
        params![quantity, morning_qty, noon_qty, evening_qty, recorded_at, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// --- Advanced Crop Lifecycle Commands ---

#[tauri::command]
pub fn get_crop_cycles(state: State<DbState>) -> Result<Vec<CropCycle>, String> {
    get_crop_cycles_logic(&state)
}

pub fn get_crop_cycles_logic(db: &DbState) -> Result<Vec<CropCycle>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("
        SELECT c.id, c.crop_id, cr.name as crop_name, c.plot_id, p.name as plot_name, c.status, c.start_date, c.end_date, c.notes, c.created_at
        FROM crop_cycles c
        LEFT JOIN crops cr ON c.crop_id = cr.id
        LEFT JOIN plots p ON c.plot_id = p.id
        ORDER BY c.start_date DESC
    ").map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(CropCycle {
                id: row.get(0)?,
                crop_id: row.get(1)?,
                crop_name: row.get(2)?,
                plot_id: row.get(3)?,
                plot_name: row.get(4)?,
                status: row.get(5)?,
                start_date: row.get(6)?,
                end_date: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn add_crop_cycle(
    state: State<DbState>,
    crop_id: String,
    plot_id: String,
    start_date: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO crop_cycles (id, crop_id, plot_id, start_date, notes) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, crop_id, plot_id, start_date, notes],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn get_crop_stages(state: State<DbState>, cycle_id: String) -> Result<Vec<CropStage>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, cycle_id, stage, started_at, notes, created_at FROM crop_stages WHERE cycle_id = ?1 ORDER BY started_at ASC")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map(params![cycle_id], |row| {
            Ok(CropStage {
                id: row.get(0)?,
                cycle_id: row.get(1)?,
                stage: row.get(2)?,
                started_at: row.get(3)?,
                notes: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn add_crop_stage(
    state: State<DbState>,
    cycle_id: String,
    stage: String,
    started_at: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO crop_stages (id, cycle_id, stage, started_at, notes) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, cycle_id, stage, started_at, notes],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn get_yield_records(
    state: State<DbState>,
    cycle_id: Option<String>,
) -> Result<Vec<YieldRecord>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let sql = if cycle_id.is_some() {
        "SELECT id, cycle_id, quantity, unit, quality, date, notes, created_at FROM yield_records WHERE cycle_id = ?1 ORDER BY date DESC"
    } else {
        "SELECT id, cycle_id, quantity, unit, quality, date, notes, created_at FROM yield_records ORDER BY date DESC"
    };
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

    let mut list = Vec::new();

    if let Some(cid) = cycle_id {
        let iter = stmt
            .query_map(params![cid], |row| {
                Ok(YieldRecord {
                    id: row.get(0)?,
                    cycle_id: row.get(1)?,
                    quantity: row.get(2)?,
                    unit: row.get(3)?,
                    quality: row.get(4)?,
                    date: row.get(5)?,
                    notes: row.get(6)?,
                    created_at: row.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for item in iter {
            list.push(item.map_err(|e| e.to_string())?);
        }
    } else {
        let iter = stmt
            .query_map([], |row| {
                Ok(YieldRecord {
                    id: row.get(0)?,
                    cycle_id: row.get(1)?,
                    quantity: row.get(2)?,
                    unit: row.get(3)?,
                    quality: row.get(4)?,
                    date: row.get(5)?,
                    notes: row.get(6)?,
                    created_at: row.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for item in iter {
            list.push(item.map_err(|e| e.to_string())?);
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn add_yield_record(
    state: State<DbState>,
    cycle_id: String,
    quantity: f64,
    unit: String,
    quality: Option<String>,
    date: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO yield_records (id, cycle_id, quantity, unit, quality, date, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, cycle_id, quantity, unit, quality, date, notes],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

// --- Input Usage Commands ---

#[tauri::command]
pub fn get_inputs(state: State<DbState>) -> Result<Vec<Input>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name, category, unit, unit_price, stock_quantity FROM inputs ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Input {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
                unit: row.get(3)?,
                unit_price: row.get(4)?,
                stock_quantity: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn add_input(
    state: State<DbState>,
    name: String,
    category: String,
    unit: String,
    unit_price: f64,
    stock_quantity: f64,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO inputs (id, name, category, unit, unit_price, stock_quantity) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, name, category, unit, unit_price, stock_quantity],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn record_input_usage(
    state: State<DbState>,
    cycle_id: String,
    input_id: String,
    quantity: f64,
    cost: f64,
    date: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();

    // Atomic usage log + stock update + finance entry
    conn.execute(
        "INSERT INTO crop_input_usage (id, cycle_id, input_id, quantity, cost, date, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, cycle_id, input_id, quantity, cost, date, notes],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE inputs SET stock_quantity = stock_quantity - ?1 WHERE id = ?2",
        params![quantity, input_id],
    )
    .map_err(|e| e.to_string())?;

    if cost > 0.0 {
        let finance_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO finance_records (id, type, category, amount, date, description, linked_entity_type, linked_entity_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![finance_id, "expense", "Crop Inputs", cost, date, format!("Input Usage: {}", input_id), "crop_input_usage", id],
        ).ok();
    }

    Ok(id)
}

#[tauri::command]
pub fn get_input_usage(
    state: State<DbState>,
    cycle_id: Option<String>,
) -> Result<Vec<InputUsage>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let sql = if cycle_id.is_some() {
        "SELECT u.id, u.cycle_id, u.input_id, i.name as input_name, u.quantity, u.cost, u.date, u.notes FROM crop_input_usage u JOIN inputs i ON u.input_id = i.id WHERE u.cycle_id = ?1 ORDER BY u.date DESC"
    } else {
        "SELECT u.id, u.cycle_id, u.input_id, i.name as input_name, u.quantity, u.cost, u.date, u.notes FROM crop_input_usage u JOIN inputs i ON u.input_id = i.id ORDER BY u.date DESC"
    };
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

    let mut list = Vec::new();

    if let Some(cid) = cycle_id {
        let iter = stmt
            .query_map(params![cid], |row| {
                Ok(InputUsage {
                    id: row.get(0)?,
                    cycle_id: row.get(1)?,
                    input_id: row.get(2)?,
                    input_name: row.get(3)?,
                    quantity: row.get(4)?,
                    cost: row.get(5)?,
                    date: row.get(6)?,
                    notes: row.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for item in iter {
            list.push(item.map_err(|e| e.to_string())?);
        }
    } else {
        let iter = stmt
            .query_map([], |row| {
                Ok(InputUsage {
                    id: row.get(0)?,
                    cycle_id: row.get(1)?,
                    input_id: row.get(2)?,
                    input_name: row.get(3)?,
                    quantity: row.get(4)?,
                    cost: row.get(5)?,
                    date: row.get(6)?,
                    notes: row.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for item in iter {
            list.push(item.map_err(|e| e.to_string())?);
        }
    }
    Ok(list)
}

// --- Operational Tracking Commands ---

#[tauri::command]
pub fn get_tasks(state: State<DbState>) -> Result<Vec<Task>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("
        SELECT t.id, t.title, t.description, t.priority, t.assigned_to, w.name as worker_name, t.due_date, t.status
        FROM tasks t
        LEFT JOIN workers w ON t.assigned_to = w.id
        ORDER BY t.due_date ASC
    ").map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                priority: row.get(3)?,
                assigned_to: row.get(4)?,
                worker_name: row.get(5)?,
                due_date: row.get(6)?,
                status: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn add_task(
    state: State<DbState>,
    title: String,
    description: Option<String>,
    priority: String,
    assigned_to: Option<String>,
    due_date: Option<String>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO tasks (id, title, description, priority, assigned_to, due_date) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, title, description, priority, assigned_to, due_date],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn update_task(state: State<DbState>, id: String, status: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE tasks SET status = ?1 WHERE id = ?2",
        params![status, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_daily_logs(
    state: State<DbState>,
    date: Option<String>,
) -> Result<Vec<DailyLog>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let sql = if date.is_some() {
        "SELECT l.id, l.cycle_id, l.task_id, l.worker_id, w.name as worker_name, l.activity, l.time_spent_hours, l.date, l.notes 
         FROM daily_logs l LEFT JOIN workers w ON l.worker_id = w.id WHERE l.date = ?1 ORDER BY l.created_at DESC"
    } else {
        "SELECT l.id, l.cycle_id, l.task_id, l.worker_id, w.name as worker_name, l.activity, l.time_spent_hours, l.date, l.notes 
         FROM daily_logs l LEFT JOIN workers w ON l.worker_id = w.id ORDER BY l.date DESC LIMIT 100"
    };
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

    let mut list = Vec::new();

    if let Some(d) = date {
        let iter = stmt
            .query_map(params![d], |row| {
                Ok(DailyLog {
                    id: row.get(0)?,
                    cycle_id: row.get(1)?,
                    task_id: row.get(2)?,
                    worker_id: row.get(3)?,
                    worker_name: row.get(4)?,
                    activity: row.get(5)?,
                    time_spent_hours: row.get(6)?,
                    date: row.get(7)?,
                    notes: row.get(8)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for item in iter {
            list.push(item.map_err(|e| e.to_string())?);
        }
    } else {
        let iter = stmt
            .query_map([], |row| {
                Ok(DailyLog {
                    id: row.get(0)?,
                    cycle_id: row.get(1)?,
                    task_id: row.get(2)?,
                    worker_id: row.get(3)?,
                    worker_name: row.get(4)?,
                    activity: row.get(5)?,
                    time_spent_hours: row.get(6)?,
                    date: row.get(7)?,
                    notes: row.get(8)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for item in iter {
            list.push(item.map_err(|e| e.to_string())?);
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn add_daily_log(
    state: State<DbState>,
    cycle_id: Option<String>,
    task_id: Option<String>,
    worker_id: Option<String>,
    activity: String,
    time_spent: Option<f64>,
    date: String,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO daily_logs (id, cycle_id, task_id, worker_id, activity, time_spent_hours, date, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, cycle_id, task_id, worker_id, activity, time_spent, date, notes],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

// --- Worker Attendance & ERP Commands ---

#[tauri::command]
pub fn get_attendance(state: State<DbState>, date: String) -> Result<Vec<Attendance>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "
        SELECT a.id, a.worker_id, w.name as worker_name, a.check_in, a.check_out, a.status, a.date
        FROM attendance a
        JOIN workers w ON a.worker_id = w.id
        WHERE a.date = ?1
    ",
        )
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map(params![date], |row| {
            Ok(Attendance {
                id: row.get(0)?,
                worker_id: row.get(1)?,
                worker_name: row.get(2)?,
                check_in: row.get(3)?,
                check_out: row.get(4)?,
                status: row.get(5)?,
                date: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn record_attendance(
    state: State<DbState>,
    worker_id: String,
    status: String,
    date: String,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let check_in = format!("{} 08:00:00", date);
    conn.execute(
        "INSERT INTO attendance (id, worker_id, status, date, check_in) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, worker_id, status, date, check_in],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn get_payroll(state: State<DbState>) -> Result<Vec<Payroll>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("
        SELECT p.id, p.worker_id, w.name as worker_name, p.period_start, p.period_end, p.base_pay, p.bonus, p.deductions, p.total_pay, p.status
        FROM payroll p
        JOIN workers w ON p.worker_id = w.id
        ORDER BY p.period_end DESC
    ").map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Payroll {
                id: row.get(0)?,
                worker_id: row.get(1)?,
                worker_name: row.get(2)?,
                period_start: row.get(3)?,
                period_end: row.get(4)?,
                base_pay: row.get(5)?,
                bonus: row.get(6)?,
                deductions: row.get(7)?,
                total_pay: row.get(8)?,
                status: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn generate_payroll(
    state: State<DbState>,
    worker_id: String,
    period_start: String,
    period_end: String,
    bonus: f64,
    deductions: f64,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    // Calculate base pay from daily_rate * attendance days
    let mut stmt = conn
        .prepare("SELECT daily_rate FROM workers WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let daily_rate: f64 = stmt
        .query_row(params![worker_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT COUNT(*) FROM attendance WHERE worker_id = ?1 AND date >= ?2 AND date <= ?3 AND status = 'present'")
        .map_err(|e| e.to_string())?;
    let days_present: i64 = stmt
        .query_row(params![worker_id, period_start, period_end], |row| {
            row.get(0)
        })
        .map_err(|e| e.to_string())?;

    let base_pay = (days_present as f64) * daily_rate;
    let total_pay = base_pay + bonus - deductions;
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO payroll (id, worker_id, period_start, period_end, base_pay, bonus, deductions, total_pay) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, worker_id, period_start, period_end, base_pay, bonus, deductions, total_pay],
    ).map_err(|e| e.to_string())?;

    // Add financial expense record
    let finance_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO finance_records (id, type, category, amount, date, description, linked_entity_type, linked_entity_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![finance_id, "expense", "Payroll", total_pay, period_end, format!("Payroll for {} ({} - {})", worker_id, period_start, period_end), "payroll", id],
    ).ok();

    Ok(id)
}

// --- Budget Management Commands ---

#[tauri::command]
pub fn get_budgets(state: State<DbState>) -> Result<Vec<Budget>, String> {
    get_budgets_logic(&state)
}

pub fn get_budgets_logic(db: &DbState) -> Result<Vec<Budget>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name, start_date, end_date, total_amount, status FROM budgets ORDER BY start_date DESC")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Budget {
                id: row.get(0)?,
                name: row.get(1)?,
                start_date: row.get(2)?,
                end_date: row.get(3)?,
                total_amount: row.get(4)?,
                status: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn add_budget(
    state: State<DbState>,
    name: String,
    start_date: String,
    end_date: String,
    total_amount: f64,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO budgets (id, name, start_date, end_date, total_amount) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, name, start_date, end_date, total_amount],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn get_budget_items(
    state: State<DbState>,
    budget_id: String,
) -> Result<Vec<BudgetItem>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, budget_id, category, allocated_amount, spent_amount, notes FROM budget_items WHERE budget_id = ?1")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map(params![budget_id], |row| {
            Ok(BudgetItem {
                id: row.get(0)?,
                budget_id: row.get(1)?,
                category: row.get(2)?,
                allocated_amount: row.get(3)?,
                spent_amount: row.get(4)?,
                notes: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn add_budget_item(
    state: State<DbState>,
    budget_id: String,
    category: String,
    allocated_amount: f64,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO budget_items (id, budget_id, category, allocated_amount, notes) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, budget_id, category, allocated_amount, notes],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

// --- Customer CRM Commands ---

#[tauri::command]
pub fn get_customers(state: State<DbState>) -> Result<Vec<Customer>, String> {
    get_customers_logic(&state)
}

pub fn get_customers_logic(db: &DbState) -> Result<Vec<Customer>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, phone, email, address, notes FROM customers ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                address: row.get(4)?,
                notes: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn add_customer(
    state: State<DbState>,
    name: String,
    phone: Option<String>,
    email: Option<String>,
    address: Option<String>,
    notes: Option<String>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO customers (id, name, phone, email, address, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, name, phone, email, address, notes],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn get_orders(state: State<DbState>) -> Result<Vec<Order>, String> {
    get_orders_logic(&state)
}

pub fn get_orders_logic(db: &DbState) -> Result<Vec<Order>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    // Note: AI tool usage doesn't need specific customer filter usually,
    // but if needed we can add a wrapper.
    let sql = "SELECT o.id, o.customer_id, c.name as customer_name, o.order_date, o.total_amount, o.status, o.payment_status 
         FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.order_date DESC";

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Order {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                customer_name: row.get(2)?,
                order_date: row.get(3)?,
                total_amount: row.get(4)?,
                status: row.get(5)?,
                payment_status: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in iter {
        list.push(item.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn add_order(
    state: State<DbState>,
    customer_id: String,
    order_date: String,
    total_amount: f64,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO orders (id, customer_id, order_date, total_amount) VALUES (?1, ?2, ?3, ?4)",
        params![id, customer_id, order_date, total_amount],
    )
    .map_err(|e| e.to_string())?;

    // Add financial income record
    let finance_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO finance_records (id, type, category, amount, date, description, linked_entity_type, linked_entity_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![finance_id, "income", "Sales", total_amount, order_date, format!("Order from customer: {}", customer_id), "orders", id],
    ).ok();

    Ok(id)
}

#[tauri::command]
pub async fn chat_with_ai(
    state: State<'_, DbState>,
    history: Vec<ollama_rs::generation::chat::ChatMessage>,
) -> Result<serde_json::Value, String> {
    let agent = crate::ai::OllamaAgent::new("llama3.1".to_string());
    agent.chat(history, &state).await
}
