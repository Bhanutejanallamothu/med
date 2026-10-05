# Swecha Medical — Pharmacy & Clinic Inventory ERP System
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Security Audit](https://img.shields.io/badge/security-audited-blue.svg)]()
[![Tech Stack](https://img.shields.io/badge/stack-JavaScript-informational.svg)]()
[![License](https://img.shields.io/badge/license-private-lightgrey.svg)]()

## Overview
Swecha Medical is a full-stack healthcare inventory, pharmacy tracking, and clinic operations ERP system developed for community health centers and non-profit healthcare initiatives. Built with Node.js, Express, MongoDB Atlas, and React, it tracks pharmaceutical stock reserves, expiry dates, doctor clinical appointments, and dispensary records.

- **Problem Solved:** Medicine stockout prevention, expiration date tracking, and transparent pharmaceutical distribution in community clinics.
- **Target Users:** Pharmacists, clinic directors, inventory clerks, and volunteer medical practitioners.
- **Current Status:** Functional Full-Stack System.

## Features
- **Pharmaceutical Inventory Ledger:** Real-time medicine stock tracking, batch numbers, and expiry alerts.
- **ODS/Excel Inventory Ingestion:** Python automated ETL script (`inventory.py`) for bulk loading medicine sheets.
- **Doctor Consultation Management:** Scheduling, doctor availability rosters, and clinic queue management.
- **Dispensation Auditing:** Prescription fulfillment records tracking dispensed medicines per patient.

## Architecture
```mermaid
flowchart TD
    Staff["Pharmacist / Clinic Staff"] --> WebUI["React Frontend (Port 3000)"]
    WebUI --> API["Express.js Server (Port 5002)"]
    API --> Auth["JWT & Security Middleware"]
    API --> MongoDB[("MongoDB Atlas Database")]
    ETL["Python Inventory Migrator (inventory.py)"] --> MongoDB
```

## User Flow
```mermaid
sequenceDiagram
    autonumber
    actor Pharmacist as Clinic Pharmacist
    participant UI as React Dispensary Portal
    participant Server as Express Server (Port 5002)
    participant DB as MongoDB Atlas Database

    Pharmacist->>UI: Search medicine inventory by generic name
    UI->>Server: GET /api/inventory?search=Paracetamol
    Server->>DB: Query medicines collection
    DB-->>Server: Return stock batches, quantities, and expiration dates
    Server-->>UI: Display available stock inventory
    Pharmacist->>UI: Dispense medication against patient prescription
    UI->>Server: POST /api/inventory/dispense (medicineId, quantity, patientId)
    Server->>DB: Decrement medicine batch stock & record audit trail
    DB-->>Server: Stock updated
    Server-->>UI: Print dispensation confirmation receipt
```

## Technology Stack
| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18, React Router, Bootstrap | Pharmacy inventory interface and doctor roster |
| Backend | Node.js, Express.js | Inventory validation, dispatch APIs, and auth |
| Database | MongoDB Atlas / Mongoose | Document storage for pharmaceuticals and appointments |
| Data Migration | Python 3, PyExcel-ODS, PyMongo | Bulk batch migration and inventory ingestion |

## Infrastructure
- **Frontend Port:** 3000
- **Backend Port:** 5002
- **Database:** MongoDB Atlas (Cloud NoSQL)
- **Containerization:** Docker & Docker Compose configuration provided

## Project Structure
```text
med/
├── backend/
│   ├── models/          # Medicine, Doctor, Appointment, User schemas
│   ├── routes/          # Inventory and clinic route controllers
│   ├── .env.example     # Environment template
│   └── server.js        # Express application entry
├── frontend/
│   ├── src/             # React views and inventory tables
│   ├── package.json     # Frontend dependencies
│   └── .env.example     # Frontend config template
├── scripts/             # Data migration notebooks and bash utilities
├── inventory.py         # Batch inventory ingestion script
├── docker-compose.yml   # Container orchestration definition
├── .gitignore           # Git ignore definitions
└── README.md            # Technical documentation
```

## Prerequisites
- Node.js >= 18.x
- Python >= 3.9 (for inventory ETL scripts)
- MongoDB Atlas cluster or local MongoDB Server >= 6.0

## Environment Variables
Create `backend/.env`:
```env
PORT=5002
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.mongodb.net/swecha_med?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret
SMS_API_KEY=your_sms_api_key_optional
```
Create `frontend/.env`:
```env
REACT_APP_BACKEND=http://localhost:5002
```

## Local Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Bhanutejanallamothu/med.git
   cd med
   ```
2. Start Backend:
   ```bash
   cd backend
   npm install
   npm start
   ```
3. Start Frontend (in another terminal):
   ```bash
   cd ../frontend
   npm install
   npm start
   ```
4. Access ERP portal at `http://localhost:3000`.

## Docker Setup
Launch complete environment via Docker Compose:
```bash
docker compose up -d
```

## Database Setup
Collections automatically initialize via Mongoose schemas (`medicines`, `doctors`, `appointments`).

## API Documentation
- `GET /get_doctors` - List all registered physicians.
- `POST /add_doctor` - Register a new medical practitioner.
- `GET /api/inventory` - Retrieve medicine stock levels and expiry dates.
- `POST /api/inventory/dispense` - Record dispensed medication.

## Deployment
Deploy backend to Render / Railway; deploy frontend to Netlify / Vercel.

## Security
- Hardcoded MongoDB credentials eliminated and externalized to `.env`.
- Password hashing via bcrypt.
- Input validation on inventory quantity updates to prevent negative stock values.

## Testing
```bash
cd backend && npm test
```

## Troubleshooting
- **MongoNetworkError:** Ensure your IP address is whitelisted in MongoDB Atlas Network Access.

## Future Improvements
- Automated barcode scanner input integration for pharmacy checkouts.
- Automated low-stock procurement purchase orders.

## License
Open-source community project. All rights reserved by repository owner.
