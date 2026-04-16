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
            commands::delete_milk_record,
            commands::update_milk_record,
            commands::get_milk_records,
            commands::chat_with_ai
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
