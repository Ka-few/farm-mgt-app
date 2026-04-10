# Farm Management Application

A comprehensive, desktop-native farm management tool built with **Tauri**, **React**, **TypeScript**, and **SQLite**. It enables farmers and agribusinesses to organize and track multiple aspects of farm production natively on desktop operating systems (Linux, Windows, macOS).

## Tech Stack
* **Frontend**: React + TypeScript + Vanilla CSS (Glassmorphism UI)
* **Backend**: Rust + Tauri Command Handlers
* **Database**: SQLite (via `rusqlite`)

## Features

### 🚜 Farm Setup & Architecture
* Define and structure your farm profile natively.
* Establish standard planting areas (`plots`, `greenhouses`, or default `General Greenhouse` & `General Open Field`).

### 🌾 Crop Management
* Track seed varieties, planting dates, and crop growth phases.
* Define and link crops seamlessly to various plots of land or greenhouse locations.

### 🐄 Livestock Production
* Register animals natively by species (dairy, poultry, beef, etc.).
* Track daily milk yields via a consolidated form capturing Morning, Noon, and Evening sessions with auto-calculated daily totals.
* Log scheduled veterinary activity and medical expenses via the Health Management module.

### 💧 Irrigation Tracking
* Monitor water source usage alongside total liters and daily expenditure per planting area relative to predefined plots or field segments.

### 👷 Labor & Attendance
* Define worker roles and daily wages.
* Log daily individual tasks and automatically link labor charges to financial expenditure.

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

The SQLite database file (`farm_mgt.db`) is generated dynamically within the user's local application data directory (e.g. `~/.local/share/farm-mgt-app/` on Linux).
