# ShambaSmart FARM Management Application

A modern, desktop-native farm management tool built with **Tauri**, **React**, **TypeScript**, and **SQLite**. Featuring a premium "Agricultural-Fintech" design and an integrated **Offline AI Assistant**, it enables farmers to organize, track, and generate metrics natively across Linux, Windows, and macOS.

## ✨ Premium UI & UX
* **Premium Farm Theme**: A sophisticated, high-contrast light theme featuring deep forest greens and gold accents, designed for clarity and a professional feel.
* **Modern Shell**: A sleek side-navigation layout with soft shadows and a focused workspace.
* **Global Notifications**: A standardized, globally accessible React context toast system providing real-time feedback for all operational actions.

## 🤖 AI Farm Assistant
* **Offline AI Core**: Powered by **Ollama (Llama 3.1)**, offering secure, private data analysis and assistance without an internet connection.
* **Database Tool Calling**: The AI natively interacts with the local SQLite database via secure Tauri IPC commands.
* **Interactive Chat**: A floating assistant window with clear conversation history and smart prompt suggestions.
* **Operational Intelligence**: Ask questions about your workers, livestock, or finances in plain English.

## 🛠️ Tech Stack
* **Frontend**: React + TypeScript + Vanilla CSS, Recharts (Visualizations)
* **Backend**: Rust + Tauri Command Handlers
* **Database**: SQLite (via `@tauri-apps/plugin-sql`)
* **Exporting**: jsPDF & jsPDF-AutoTable
* **AI Engine**: Ollama (Offline LLM integration)

## Core Features

### 🚜 Farm Setup & Architecture
* Define and structure your farm profile natively.
* Establish standard planting areas (`plots`, `greenhouses`).
* **Full CRUD Support**: Complete data management capabilities across the entire farm architecture.

### 📊 Intelligence & Reporting
* **Interactive Visualizations**: Integrated **Recharts** for dynamic and type-safe data analytics.
* **PDF Exports**: Professional offline report generation across all tabs using **jsPDF**.
* **Financial Reports**: Complete breakdown of income vs. expenses synchronized with daily operational costs.
* **Production Metrics**: Yield tracking for milk, eggs, and meat with aggregated timeline views.
* **Health Insights**: Comprehensive veterinary history and medical expense tracking.
* **Resource Reports**: Real-time workforce distribution and crop life-cycle metrics.

### 🐄 Livestock & Poultry Management
* **Registry**: Register animals by species with unique tag tracking and comprehensive CRUD operations.
* **Production**: Detailed yield logging (e.g., Morning/Noon/Evening milk sessions) with auto-calculated totals.
* **Health**: Record vaccinations, treatments, and follow-up schedules with high readability.

### 🌾 Crop & Irrigation Management
* **Lifecycle Tracking**: Monitor seed varieties from planting through vegetative to harvest phases.
* **Irrigation Logging**: Precise tracking of water sources, volume, duration, and associated energy costs.

### 👷 Labor & Workforce
* Define roles, manage active status, track daily tasks, and seamlessly edit or delete records.
* Automated financial integration for wage-based expenditure tracking.

### 🤝 CRM (Customer Management)
* Manage customer profiles, interaction logs, and buyer/vendor relationships natively.

## Development & Setup
Ensure you have the Rust toolchain, Node.js, and **Ollama** installed.

```sh
# Install frontend dependencies
npm install

# Run application in development mode
npm run tauri dev

# Build the application for release
npm run tauri build
```

The SQLite database file (`farm_mgt.db`) is generated dynamically within the user's local application data directory (e.g., `~/.local/share/com.farmmgt.app/` on Linux).
