# 🌾 AgriHub: Unified Smart Agriculture Decision Platform

AgriHub is a farmer-centric agricultural decision-support platform integrating IoT sensor telemetry, GIS cadastral mapping, computer vision crop disease diagnostics, weather early warning systems, and APMC mandi price intelligence.

---

## 🚀 Quick Start Commands

### 1. Install Dependencies
Run from the root directory:
```bash
npm install
```

### 2. Run the Full Application (Frontend + Backend API)
Run both simultaneously with a single command:
```bash
npm run dev
```
- **Web Frontend**: [http://localhost:3000/](http://localhost:3000/)
- **Backend API**: [http://localhost:4000/](http://localhost:4000/)
- **API Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 🛠️ Running Services Separately (In Different Terminals)

If you prefer running services in separate terminal windows:

### Terminal 1: Backend API
```bash
npm run dev:api
```
*(Runs the Express TypeScript server on port `4000` with hot reloading via `tsx`)*

### Terminal 2: Web Client (React + Vite)
```bash
npm run dev:web
```
*(Runs the Vite dev server on port `3000` with instant HMR)*

### Terminal 3 (Optional): Python AI/ML Microservice
```bash
cd services/ml
pip install -r requirements.txt
python main.py
```
*(Runs the FastAPI ML inference service on port `8000`)*

---

## 🏗️ Build Commands

```bash
# Build all workspaces (contracts, api, web)
npm run build

# Build individual workspaces
npm run build:contracts
npm run build:api
npm run build:web
```

---

## 🔐 Credentials & Demo Login

1. **Pre-seeded Demo Farmer Account**:
   - **Mobile Number**: `9876543210`
   - **Password**: `agrihub123`
   - *(Or click the "1-Click Demo Login" button on the login screen)*

2. **Cloud Database (Supabase)**:
   - Configure your keys in [`.env`](.env):
     ```env
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```
   - Run SQL migration: [`supabase/migrations/20260904000001_init_postgis_schema.sql`](supabase/migrations/20260904000001_init_postgis_schema.sql)
   - Run SQL seed data: [`supabase/seed.sql`](supabase/seed.sql)
