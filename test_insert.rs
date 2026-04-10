use rusqlite::{Connection, params};

fn main() {
    let conn = Connection::open("/home/njoroge/.local/share/farm-mgt-app/farm_mgt.db").unwrap();
    match conn.execute(
        "INSERT INTO crops (id, plot_id, name, variety, phase, planting_date) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params!["test-id-123", "greenhouse", "Tomato", "Moneymaker", "Planting", "2026-04-10"],
    ) {
        Ok(_) => println!("Success!"),
        Err(e) => println!("Error: {}", e),
    }
}
