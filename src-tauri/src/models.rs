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
    pub planted_area: Option<f64>,
    pub unit: Option<String>,
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

/* Advanced Crop Lifecycle */
#[derive(Debug, Serialize, Deserialize)]
pub struct CropCycle {
    pub id: String,
    pub crop_id: String,
    pub crop_name: Option<String>,
    pub plot_id: String,
    pub plot_name: Option<String>,
    pub status: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub notes: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CropStage {
    pub id: String,
    pub cycle_id: String,
    pub stage: String,
    pub started_at: String,
    pub notes: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct YieldRecord {
    pub id: String,
    pub cycle_id: String,
    pub quantity: f64,
    pub unit: String,
    pub quality: Option<String>,
    pub date: String,
    pub notes: Option<String>,
    pub created_at: Option<String>,
}

/* Input Usage */
#[derive(Debug, Serialize, Deserialize)]
pub struct Input {
    pub id: String,
    pub name: String,
    pub category: String,
    pub unit: String,
    pub unit_price: f64,
    pub stock_quantity: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InputUsage {
    pub id: String,
    pub cycle_id: String,
    pub input_id: String,
    pub input_name: Option<String>,
    pub quantity: f64,
    pub cost: f64,
    pub date: String,
    pub notes: Option<String>,
}

/* Operational Tracking */
#[derive(Debug, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub priority: String,
    pub assigned_to: Option<String>,
    pub worker_name: Option<String>,
    pub due_date: Option<String>,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DailyLog {
    pub id: String,
    pub cycle_id: Option<String>,
    pub task_id: Option<String>,
    pub worker_id: Option<String>,
    pub worker_name: Option<String>,
    pub activity: String,
    pub time_spent_hours: Option<f64>,
    pub date: String,
    pub notes: Option<String>,
}

/* Worker ERP */
#[derive(Debug, Serialize, Deserialize)]
pub struct Attendance {
    pub id: String,
    pub worker_id: String,
    pub worker_name: Option<String>,
    pub check_in: String,
    pub check_out: Option<String>,
    pub status: String,
    pub date: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Payroll {
    pub id: String,
    pub worker_id: String,
    pub worker_name: Option<String>,
    pub period_start: String,
    pub period_end: String,
    pub base_pay: f64,
    pub bonus: f64,
    pub deductions: f64,
    pub total_pay: f64,
    pub status: String,
}

/* Budgeting */
#[derive(Debug, Serialize, Deserialize)]
pub struct Budget {
    pub id: String,
    pub name: String,
    pub start_date: String,
    pub end_date: String,
    pub total_amount: f64,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BudgetItem {
    pub id: String,
    pub budget_id: String,
    pub category: String,
    pub allocated_amount: f64,
    pub spent_amount: f64,
    pub notes: Option<String>,
}

/* CRM */
#[derive(Debug, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Order {
    pub id: String,
    pub customer_id: String,
    pub customer_name: Option<String>,
    pub order_date: String,
    pub total_amount: f64,
    pub status: String,
    pub payment_status: String,
}
