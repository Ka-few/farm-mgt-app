use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Farm {
    pub id: String,
    pub name: String,
    pub currency: Option<String>,
    pub setup_complete: i32,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Plot {
    pub id: String,
    pub farm_id: Option<String>,
    pub name: String,
    pub plot_type: String, // 'field', 'greenhouse'
    pub size: Option<f64>,
    pub unit: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Worker {
    pub id: String,
    pub name: String,
    pub role: Option<String>,
    pub daily_rate: Option<f64>,
    pub is_active: i32,
    pub created_at: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct LaborRecord {
    pub id: String,
    pub worker_id: Option<String>,
    pub plot_id: Option<String>,
    pub activity: Option<String>,
    pub date: String,
    pub hours: Option<f64>,
    pub amount: Option<f64>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Livestock {
    pub id: String,
    pub tag: Option<String>,
    pub name: Option<String>,
    pub species: String, // 'dairy', 'poultry'
    pub breed: Option<String>,
    pub dob: Option<String>,
    pub status: Option<String>,
    pub quantity: Option<i32>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthRecord {
    pub id: String,
    pub livestock_id: Option<String>,
    pub livestock_tag: Option<String>,
    pub livestock_name: Option<String>,
    pub record_date: String,
    pub record_type: String, // vaccination, treatment, checkup
    pub description: Option<String>,
    pub cost: Option<f64>,
    pub next_visit: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductionLog {
    pub id: String,
    pub livestock_id: Option<String>,
    pub livestock_tag: Option<String>,
    pub livestock_name: Option<String>,
    pub production_type: String, // 'milk', 'eggs'
    pub quantity: f64,
    pub unit: Option<String>,
    pub morning_qty: Option<f64>,
    pub noon_qty: Option<f64>,
    pub evening_qty: Option<f64>,
    pub recorded_at: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FinanceRecord {
    pub id: String,
    pub record_type: String, // 'income', 'expense'
    pub category: String,
    pub amount: f64,
    pub date: String,
    pub description: Option<String>,
    pub linked_entity_type: Option<String>,
    pub linked_entity_id: Option<String>,
    pub is_deleted: i32,
    pub created_at: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct AuditEvent {
    pub id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub action: String,
    pub payload: Option<String>,
    pub timestamp: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Crop {
    pub id: String,
    pub plot_id: Option<String>,
    pub plot_name: Option<String>,
    pub name: String,
    pub variety: Option<String>,
    pub phase: Option<String>,
    pub planting_date: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IrrigationRecord {
    pub id: String,
    pub plot_id: Option<String>,
    pub plot_name: Option<String>,
    pub method: Option<String>,
    pub source: Option<String>,
    pub duration_minutes: Option<i32>,
    pub water_used_litres: Option<f64>,
    pub date: String,
    pub cost: Option<f64>,
    pub created_at: Option<String>,
}
