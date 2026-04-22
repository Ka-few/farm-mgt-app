mod ai;
mod commands;
mod db;
mod models;

use db::{establish_connection, DbState};
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let conn = establish_connection(&app.handle());
            app.manage(DbState(std::sync::Mutex::new(conn)));
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::get_workers,
            commands::add_worker,
            commands::record_labor,
            commands::get_plots,
            commands::add_plot,
            commands::get_crops,
            commands::add_crop,
            commands::record_irrigation,
            commands::get_irrigation_records,
            commands::record_milk,
            commands::record_production,
            commands::get_production_logs,
            commands::get_livestock,
            commands::add_livestock,
            commands::update_livestock,
            commands::delete_livestock,
            commands::update_production,
            commands::delete_production,
            commands::get_health_records,
            commands::add_health_record,
            commands::get_production_summary,
            commands::get_finance_summary,
            commands::get_finance_records,
            commands::add_finance_record,
            commands::get_farm,
            commands::update_farm,
            commands::delete_worker,
            commands::update_worker,
            commands::delete_plot,
            commands::update_plot,
            commands::delete_crop,
            commands::update_crop,
            commands::add_weeding_record,
            commands::get_weeding_records,
            commands::delete_weeding_record,
            commands::update_weeding_record,
            commands::add_harvest_record,
            commands::get_harvest_records,
            commands::delete_harvest_record,
            commands::update_harvest_record,
            commands::get_labor_logs,
            commands::delete_irrigation_record,
            commands::delete_finance_record,
            commands::update_finance_record,
            commands::update_order,
            commands::delete_order,
            commands::complete_payment,
            commands::delete_milk_record,
            commands::update_milk_record,
            commands::get_milk_records,
            commands::get_crop_cycles,
            commands::add_crop_cycle,
            commands::get_crop_stages,
            commands::add_crop_stage,
            commands::get_yield_records,
            commands::add_yield_record,
            commands::get_inputs,
            commands::add_input,
            commands::record_input_usage,
            commands::get_input_usage,
            commands::update_input,
            commands::delete_input,
            commands::update_input_usage,
            commands::delete_input_usage,
            commands::get_tasks,
            commands::add_task,
            commands::update_task,
            commands::get_daily_logs,
            commands::add_daily_log,
            commands::get_attendance,
            commands::record_attendance,
            commands::get_payroll,
            commands::generate_payroll,
            commands::update_payroll,
            commands::delete_payroll,
            commands::complete_payroll_payment,
            commands::get_budgets,
            commands::add_budget,
            commands::get_budget_items,
            commands::add_budget_item,
            commands::get_customers,
            commands::add_customer,
            commands::get_orders,
            commands::add_order,
            commands::chat_with_ai,
            commands::save_pdf
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
