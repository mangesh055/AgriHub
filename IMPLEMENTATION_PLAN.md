# AgriHub Implementation Plan

## 1. Product Definition

AgriHub is a farmer-centric agricultural decision-support platform. Its purpose is to turn farm, soil, weather, sensor, crop-health, and market data into explainable actions across the crop lifecycle.

The central product loop is:

`Farmer -> Farm -> Soil and history -> Crop plan -> Crop management -> Harvest estimate -> Market decision -> Profit`

The platform is not intended to replace an agricultural expert or provide guaranteed financial or treatment advice. Every AI or rule-based result must show its main inputs, confidence or uncertainty, data timestamp, and an appropriate verification message.

## 2. Primary Users

### Farmer

- Registers and manages a profile.
- Creates one or more farms and maps their boundaries.
- Enters soil, crop, irrigation, expense, and harvest information.
- Receives recommendations, alerts, and reminders.
- Uses market and marketplace workflows.

### Advisor or administrator

- Manages farmer accounts and platform content.
- Maintains schemes, seed varieties, crop metadata, agronomic guidance, and supported disease classes.
- Monitors data-source freshness, model status, alerts, and failed integrations.

### Future users

Buyers, seed/input providers, agricultural organizations, and multilingual or voice-assistant users should remain future extensions rather than MVP dependencies.

## 3. Scope Boundary

### MVP

1. Authentication and farmer profile
2. Farm registration and map boundary
3. Soil records and crop history
4. Crop recommendation with explanation
5. Current weather, forecast, and crop-aware risk alerts
6. IoT reading ingestion, simulated readings, and irrigation decision
7. Leaf image disease detection for one to three selected crops
8. Mandi prices, trends, and short-term forecast
9. Expense, revenue, and profit calculation
10. Unified dashboard and notifications

### Phase-two or advanced features

- Personalized government-scheme matching
- Curated seed assistance
- Yield prediction
- Pest and nutrient-stress classification
- Marketplace buyer workflow
- AI agricultural assistant
- Mandi transportation optimization
- Multilingual and voice interfaces
- Satellite or NDVI monitoring
- OCR for soil reports

The MVP should use simulated weather, market, and sensor data whenever a reliable live source is unavailable. The UI must label simulated or stale data clearly.

## 4. Recommended Architecture

```text
React + TypeScript web client
            |
            v
Node.js + Express application API
       |
      Supabase platform
  (PostgreSQL + PostGIS + Auth + Storage)
       |
  Python + FastAPI ML services
            ^
            |
Weather/market adapters and ESP32/MQTT or HTTP ingestion
```

### Frontend

- React and TypeScript
- React Router for pages
- A small component system for forms, status badges, charts, tables, alerts, and loading/error states
- Leaflet for farm mapping
- Recharts or Chart.js for weather, sensor, price, and profit charts
- Responsive farmer-first dashboard with clear action cards

### Application API

- Node.js, Express, and TypeScript
- JWT access authentication with refresh-token strategy or secure session cookies
- Request validation using Zod or an equivalent schema library
- Service/repository separation
- Central error handling, structured logging, rate limiting, and authorization middleware

### AI service

- Python and FastAPI
- Versioned inference endpoints
- Pydantic request/response schemas
- Model artifacts stored with version and training metadata
- A deterministic rules engine for irrigation and climate risk
- AI results persisted by the application API, not only returned transiently

### Data and storage

- Supabase PostgreSQL with PostGIS for users, farms, crop cycles, recommendations, alerts, readings, prices, and expenses
- Supabase Auth for farmer login, sessions, password recovery, and role-aware access
- Supabase Storage for private crop images and soil-report files
- Supabase Row Level Security for database-level farmer and farm ownership protection
- Supabase Realtime where live sensor or notification updates are useful
- Redis is optional for caching weather/market responses; it is not required for the first release
- A scheduled worker or Supabase scheduled function is recommended for weather synchronization, alert generation, and market ingestion

The Node.js API remains the application boundary for business rules, integrations, decision-engine orchestration, and AI-service calls. The frontend should not directly bypass these rules merely because Supabase provides generated database APIs.

## 5. Core Domain Model

Use UUID primary keys, UTC timestamps, created/updated timestamps, and foreign-key constraints. Keep farm ownership checks in every farm-scoped query.

### Identity and farm

- `users`: id, mobile, password_hash, role, created_at, updated_at
- `farmer_profiles`: id, user_id, name, preferred_language, state, district, taluka, village
- `farms`: id, farmer_id, name, area, irrigation_source, latitude, longitude, boundary geometry, notes
- `soil_records`: id, farm_id, soil_type, ph, nitrogen, phosphorus, potassium, organic_carbon, test_date, report_url
- `crop_history`: id, farm_id, crop, variety, season, year, yield, notes
- `crop_cycles`: id, farm_id, crop, variety, sowing_date, expected_harvest_date, crop_stage, status

### Decision and monitoring

- `crop_recommendations`: id, farm_id, input_snapshot, crop, score, reasons, model_version, created_at
- `weather_records`: id, farm_id, observed_at, source, temperature, humidity, rainfall, rain_probability, wind
- `weather_alerts`: id, farm_id, crop_cycle_id, risk_type, severity, message, action, source, valid_until
- `devices`: id, farm_id, device_id, device_type, status, last_seen_at
- `sensor_readings`: id, farm_id, device_id, recorded_at, soil_moisture, temperature, humidity, source
- `irrigation_recommendations`: id, farm_id, crop_cycle_id, decision, reason, input_snapshot, created_at
- `crop_observations`: id, crop_cycle_id, observed_at, stage, notes, image_url
- `disease_detections`: id, crop_cycle_id, image_url, disease, confidence, severity, guidance, model_version, created_at
- `yield_predictions`: id, crop_cycle_id, predicted_min, predicted_max, unit, model_version, created_at

### Content and market

- `government_schemes`: id, name, purpose, eligibility, benefits, documents, application_method, source_url, valid_until
- `seed_varieties`: id, crop, variety, region, season, characteristics, source_url
- `mandis`: id, name, state, district, latitude, longitude
- `mandi_prices`: id, crop, mandi_id, price_date, unit, min_price, max_price, modal_price, source
- `price_forecasts`: id, crop, mandi_id, forecast_date, predicted_price, lower_bound, upper_bound, model_version
- `market_recommendations`: id, crop_cycle_id, action, mandi_id, reason, assumptions, created_at
- `marketplace_listings`: id, farmer_id, crop, quantity, unit, quality, expected_price, available_date, location, status

### Economics and communication

- `expenses`: id, farm_id, crop_cycle_id, category, amount, expense_date, notes
- `notifications`: id, farmer_id, type, title, message, severity, read_at, created_at
- `audit_events`: id, user_id, action, entity_type, entity_id, metadata, created_at

Store recommendation inputs as snapshots so a result remains explainable even when the farmer later changes soil or crop data.

## 6. Main Workflows

### Onboarding and crop planning

1. Register with mobile and password.
2. Complete farmer profile.
3. Create a farm and draw or edit a boundary on the map.
4. Enter irrigation source, soil values, and previous crops.
5. Fetch location weather and season context.
6. Request top three crop recommendations.
7. Display score, reasons, water need, duration, and data timestamp.
8. Start a crop cycle from the selected crop.

### Daily farm decision

1. Load active crop cycle, crop stage, latest sensor reading, and forecast.
2. Generate risk alerts from forecast and crop-stage rules.
3. Generate irrigation decision from soil moisture, forecast rainfall, crop stage, and irrigation availability.
4. Display one prioritized next action with the underlying reasons.
5. Create a notification only when a new or materially changed alert exists.

### Crop-health workflow

1. Upload or capture an image for a supported crop.
2. Validate type and size, virus-scan where available, and store privately.
3. Send image reference to the FastAPI classifier.
4. Return disease, confidence, severity when supported, and guidance.
5. If confidence is below the configured threshold, return `uncertain` and recommend verification.
6. Save the detection against the crop cycle and show it in the crop timeline.

### Market-to-profit workflow

1. Select the crop cycle and expected harvest date.
2. Load current and historical prices with mandi, date, unit, and source.
3. Compare a moving-average baseline with the forecasting model.
4. Show a price range, trend, and forecast horizon.
5. Calculate sell/hold/compare guidance using price, yield range, storage, transport, and selling costs.
6. Record expenses and calculate expected revenue and profit range.

## 7. API Surface

All protected routes require authentication and farm ownership authorization.

### Authentication and profile

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/farmer/profile`
- `PUT /api/v1/farmer/profile`

### Farms and crop cycles

- `POST /api/v1/farms`
- `GET /api/v1/farms`
- `GET /api/v1/farms/:farmId`
- `PUT /api/v1/farms/:farmId`
- `POST /api/v1/farms/:farmId/soil-records`
- `GET /api/v1/farms/:farmId/soil-records`
- `POST /api/v1/farms/:farmId/crop-cycles`
- `GET /api/v1/farms/:farmId/crop-cycles`
- `PUT /api/v1/crop-cycles/:cycleId`

### Decisions and monitoring

- `POST /api/v1/ai/crop-recommendations`
- `GET /api/v1/farms/:farmId/recommendations`
- `GET /api/v1/weather/current?farmId=...`
- `GET /api/v1/weather/forecast?farmId=...`
- `GET /api/v1/farms/:farmId/weather-alerts`
- `POST /api/v1/iot/readings`
- `GET /api/v1/farms/:farmId/iot/readings`
- `GET /api/v1/farms/:farmId/irrigation-recommendation`
- `POST /api/v1/crop-cycles/:cycleId/disease-detections`
- `GET /api/v1/crop-cycles/:cycleId/observations`

### Market and economics

- `GET /api/v1/market/prices`
- `GET /api/v1/market/trends`
- `GET /api/v1/market/mandis`
- `GET /api/v1/market/forecast`
- `GET /api/v1/market/recommendation`
- `POST /api/v1/farms/:farmId/expenses`
- `GET /api/v1/farms/:farmId/expenses`
- `GET /api/v1/farms/:farmId/profit-summary`
- `POST /api/v1/marketplace/listings`
- `GET /api/v1/marketplace/listings`
- `PUT /api/v1/marketplace/listings/:listingId`

## 8. Decision Engine Rules

Implement decision logic as a testable service with structured inputs and outputs, rather than embedding rules in route handlers.

### Climate risk

- Heavy rain: forecast rainfall or probability exceeds configured threshold; warn against irrigation and spraying, and recommend drainage checks.
- Heatwave: temperature exceeds crop-specific threshold for the configured duration; recommend water and heat-stress monitoring.
- Strong wind: wind exceeds threshold; warn about spraying and vulnerable crop support.
- High humidity: sustained humidity plus crop susceptibility; flag fungal-risk monitoring.

### Irrigation

Output exactly one of `IRRIGATE`, `WAIT`, or `REDUCE` plus reason codes and human-readable explanation.

- Low moisture and low rain probability: irrigate.
- Low moisture and high rain probability: wait and recheck after rainfall.
- Adequate moisture: wait.
- Excess moisture or heavy rain: reduce/skip and check drainage.
- Missing or stale sensor input: use a clearly marked fallback and request manual confirmation.

Thresholds must be crop- and stage-configurable, versioned, and covered by scenario tests.

## 9. AI/ML Delivery Strategy

Start with reliable baselines and expose model version and evaluation date in the admin view.

### Crop recommendation

- Prepare a normalized dataset of soil, climate, season, water, previous crop, and market features.
- Train a Random Forest baseline.
- Return top-k results and feature-based reasons.
- Evaluate accuracy, precision, recall, F1, confusion matrix, and top-k suitability.

### Disease detection

- Limit MVP to one to three crops and documented classes.
- Use transfer learning with a held-out test set.
- Validate image quality and supported crop before inference.
- Evaluate accuracy, precision, recall, F1, confusion matrix, and confidence behavior.

### Price forecasting

- Begin with a moving-average baseline.
- Add a time-feature model only if it beats the baseline on a holdout period.
- Return lower and upper bounds and label the result as an estimate.

### Yield prediction

Implement after the MVP using regression and return a range with MAE, RMSE, and R2. Do not block the first release on this model.

## 10. Frontend Pages

- Login and registration
- Farmer profile
- Dashboard
- My Farms and farm map editor
- Soil and crop history
- Crop Plan and recommendation results
- Schemes and Seeds
- Weather and alerts
- Irrigation and sensor history
- Crop Health and detection history
- Market prices, forecast, mandi comparison
- Expenses and Profit
- Marketplace
- AI Assistant
- Notifications
- Admin content, data-source, and model-monitoring views

The dashboard must show farm identity, active crop and stage, current weather, highest-priority alert, irrigation decision, crop-health status, market trend, profit snapshot, and one next recommended action. Every card needs loading, empty, stale-data, and error states.

## 11. 16-Week Delivery Plan

### Weeks 1-2: Foundation

- Confirm MVP crops, supported disease classes, target geography, language, data sources, and demo farmer.
- Create repository structure and local development instructions.
- Set up React, Node API, FastAPI service, PostgreSQL/PostGIS, migrations, environment validation, and CI.
- Implement authentication, roles, request validation, error format, logging, and base UI shell.

### Weeks 3-4: Farmer and farm core

- Build profiles, farms, map boundary editing, soil records, crop history, and crop cycles.
- Add ownership authorization and database tests.
- Deliver the first usable dashboard with real persisted farm data.

### Weeks 5-6: Crop recommendation and weather

- Prepare crop data and model baseline.
- Implement inference contract and persisted recommendation snapshots.
- Integrate weather adapter with mock fallback.
- Add forecast display and climate-risk rules.

### Weeks 7-8: IoT and irrigation

- Define device registration and reading payload.
- Implement simulated readings before ESP32 integration.
- Add latest/history charts and scenario-tested irrigation rules.
- Complete the first end-to-end demo: farm to crop plan to weather to irrigation.

### Weeks 9-11: Crop health

- Prepare and document the limited disease dataset.
- Implement private image upload, validation, inference endpoint, confidence threshold, and detection history.
- Add uncertain-result handling and authoritative guidance references.

### Weeks 12-13: Market and economics

- Build market data import and source metadata.
- Add price history, trends, baseline forecast, forecast range, and mandi comparison.
- Implement sell/hold explanation and expense/profit calculations.

### Weeks 14-15: Extensions and integration

- Add curated scheme and seed content.
- Add yield prediction if data quality supports it.
- Add marketplace prototype, assistant backed by structured platform data, and notification center.
- Integrate dashboard next-action prioritization.

### Week 16: Release and demonstration

- Run end-to-end, security, usability, model, and failure-mode tests.
- Polish responsive UI and accessibility.
- Document data limitations, model metrics, setup, architecture, and demo script.
- Rehearse the complete fictional farmer scenario.

## 12. Testing and Acceptance Criteria

### Functional acceptance

- A farmer can register, create a farm, map it, add soil and start a crop cycle.
- Recommendation results contain at least three ranked options, score, reasons, and input timestamp.
- Weather alerts identify event, severity, affected farm/crop, action, and validity.
- Irrigation decisions change correctly for controlled sensor and forecast scenarios.
- Unsupported or low-confidence disease images produce an uncertain result.
- Price records show mandi, date, unit, and source.
- Profit calculation exposes cost categories, assumptions, revenue, and result.
- Dashboard presents a current next action and links to the source module.

### Technical tests

- Unit tests for validation, authorization, calculations, climate rules, irrigation rules, and recommendation formatting.
- API integration tests for every protected route and farm ownership boundary.
- Frontend tests for form errors, empty/loading/error states, and key navigation.
- ML evaluation scripts with reproducible train/test split and baseline comparison.
- IoT replay tests for duplicate, stale, malformed, and out-of-order readings.
- End-to-end test from registration through market/profit summary.
- Performance checks for dashboard load, sensor ingestion, and alert generation latency.

## 13. Security, Reliability, and Data Quality

- Hash passwords with Argon2id or bcrypt; never store plaintext passwords.
- Validate and size-limit image/document uploads; use private object-storage URLs.
- Enforce farmer ownership on every farm-scoped query.
- Rate-limit authentication, AI uploads, and sensor endpoints.
- Use environment variables for secrets and separate development/demo credentials.
- Record source, timestamp, unit, and freshness for weather and market data.
- Mark simulated, stale, unavailable, and model-generated information distinctly.
- Use migrations, backups, health checks, and structured logs.
- Avoid treatment prescriptions beyond authoritative, referenced guidance.
- Show uncertainty for forecasts and model outputs; never present them as guarantees.

## 14. Recommended Repository Layout

```text
AgriHub/
  apps/
    web/                 # React + TypeScript
    api/                 # Node + Express + TypeScript
  services/
    ml/                  # FastAPI inference and evaluation
  packages/
    contracts/           # Shared API schemas and generated types
  supabase/
    migrations/          # SQL migrations and PostGIS setup
    seed.sql              # Demo/reference data
    config.toml
  data/
    README.md            # Dataset provenance and preparation notes
  infra/
    docker-compose.yml
  docs/
    architecture.md
    api.md
    demo-script.md
  IMPLEMENTATION_PLAN.md
  README.md
```

## 15. First Build Slice

The first implementation slice should be the smallest vertical workflow:

`Register -> Create farm -> Save map boundary -> Enter soil -> View persisted farm dashboard`

Its completion proves that authentication, database migrations, PostGIS, API validation, frontend routing, and ownership authorization work together. The next slice can safely add crop recommendations because it will have a real farm and soil context to consume.

## 16. Final Demonstration Story

Use one fictional farmer, one farm, one active crop cycle, one simulated weather event, one sensor stream, one supported disease image, and one crop with two or three nearby mandis. Demonstrate that:

1. Farm data changes crop recommendations.
2. Forecast and soil moisture change irrigation advice.
3. Crop stage changes weather-risk guidance.
4. Disease confidence changes whether guidance is actionable or requires verification.
5. Yield, price, transport, and expenses affect the market and profit summary.
6. The dashboard consolidates all of these into the next recommended action.

This connected behavior is AgriHub's strongest differentiator and should be prioritized above adding many isolated features.
