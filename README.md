# JOMUKU FARM Management Application

A comprehensive, desktop-native farm management tool built with **Tauri**, **React**, **TypeScript**, and **SQLite**. It enables farmers and agribusinesses to organize, track, and generate metrics on multiple aspects of farm production natively on desktop operating systems (Linux, Windows, macOS).

## Tech Stack
* **Frontend**: React + TypeScript + Vanilla CSS (Custom Glassmorphism UI)
* **Backend**: Rust + Tauri Command Handlers
* **Database**: SQLite (via `rusqlite` natively on the filesystem)

## Core Features

### 🚜 Farm Setup & Architecture
* Define and structure your farm profile natively.
* Establish standard planting areas (`plots`, `greenhouses`, or default `General Greenhouse` & `General Open Field`).

### 📊 Comprehensive Reports
* **Financial Reports**: Complete breakdown of income vs. expenses perfectly synchronized with daily operational costs, enabling true P&L visibility.
* **Milk Reports**: Yield tracking by animal, aggregated totals, and timeline views.
* **Health Reports**: Summary of active health cases and accumulating veterinary costs.
* **Crop & Worker Reports**: Metrics detailing active crop phases and workforce distribution across the farm.

### 🐄 Livestock & Poultry Production
* Register animals natively by species (dairy, poultry, beef, pigs, goats, sheep).
* **Flock Tracking**: Register and manage poultry as flocks, dynamically tracking the number of birds per group.
* **Yield Logging**: Track daily milk yields via a consolidated form capturing Morning, Noon, and Evening sessions with auto-calculated daily totals. Record egg collection and meat production accurately.
* Log scheduled veterinary activity, treatments, and medical expenses via the Health Management module.
* Edit, update, and delete historical production and livestock registry records securely.

### 🌾 Crop Management
* Track seed varieties, planting dates, and crop growth phases.
* Define and link crops seamlessly to various plots of land or greenhouse locations.

### 💧 Irrigation Tracking
* Monitor water source usage alongside total liters and daily expenditure per planting area relative to predefined plots or field segments.

### 👷 Labor & Attendance
* Define worker roles, daily wages, and active/inactive status.
* Log daily individual tasks and automatically sink labor charges to global financial expenditures.

## Development & Setup
Ensure you have the Rust toolchain, Node.js, and your platform's C++ build tools installed.

```sh
# Install frontend dependencies
npm install

# Run application in development mode
npm run tauri dev

# Build the application for release
npm run tauri build
```

The SQLite database file (`farm_mgt.db`) is generated dynamically within the user's local application data directory (e.g., `~/.local/share/com.farmmgt.app/` on Linux).
