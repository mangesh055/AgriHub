-- =========================================================================
-- AgriHub Supabase Initial Seed Data
-- Run this in your Supabase SQL Editor after running the migration schema
-- =========================================================================

-- 1. Insert Demo User (Password is 'agrihub123', pre-hashed with bcrypt)
INSERT INTO users (id, mobile, password_hash, role)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '9876543210',
    '$2a$10$wTfZ456Hk09kX.O8hW8nQehYV4PjIe4sQ8Yg4a5QG4J9tW1Z4Yt7G',
    'FARMER'
) ON CONFLICT (mobile) DO NOTHING;

-- 2. Insert Farmer Profile
INSERT INTO farmer_profiles (id, user_id, name, preferred_language, state, district, taluka, village)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Ramesh Patel',
    'en',
    'Maharashtra',
    'Pune',
    'Haveli',
    'Uruli Kanchan'
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert Demo Farm with PostGIS Boundary Polygon
INSERT INTO farms (
    id,
    farmer_id,
    name,
    area_acres,
    irrigation_source,
    latitude,
    longitude,
    boundary_geojson,
    boundary_geom,
    notes
)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Krishna Agri Fields (East Sector)',
    4.50,
    'DRIP',
    18.4875,
    74.1332,
    '{"type":"Polygon","coordinates":[[[74.1325,18.4868],[74.1342,18.4869],[74.1339,18.4883],[74.1321,18.4881],[74.1325,18.4868]]]}',
    ST_SetSRID(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[74.1325,18.4868],[74.1342,18.4869],[74.1339,18.4883],[74.1321,18.4881],[74.1325,18.4868]]]}'), 4326),
    'Deep Black Cotton Soil, equipped with Netafim automated drip line.'
) ON CONFLICT (id) DO NOTHING;

-- 4. Insert Soil Health Record
INSERT INTO soil_records (
    id,
    farm_id,
    soil_type,
    ph,
    nitrogen,
    phosphorus,
    potassium,
    organic_carbon,
    electrical_conductivity,
    test_date
)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'BLACK_COTTON',
    7.40,
    210.00,
    28.00,
    340.00,
    0.68,
    0.42,
    '2026-01-10'
) ON CONFLICT (id) DO NOTHING;

-- 5. Insert Active Crop Cycle (Soybean)
INSERT INTO crop_cycles (
    id,
    farm_id,
    crop_name,
    variety,
    sowing_date,
    expected_harvest_date,
    current_stage,
    status
)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'Soybean',
    'JS-335 (High Pod Count)',
    '2026-06-20',
    '2026-10-05',
    'FLOWERING',
    'ACTIVE'
) ON CONFLICT (id) DO NOTHING;

-- 6. Insert IoT Device
INSERT INTO iot_devices (
    id,
    farm_id,
    device_uid,
    auth_token,
    status
)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    '33333333-3333-3333-3333-333333333333',
    'ESP32-AGRI-PUNE-01',
    'agri_token_pune_secret_2026',
    'ONLINE'
) ON CONFLICT (device_uid) DO NOTHING;

-- 7. Insert Sensor Readings
INSERT INTO sensor_readings (device_id, farm_id, soil_moisture_pct, temperature_c, humidity_pct, battery_pct, recorded_at)
VALUES 
('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 34.0, 29.5, 76.0, 92.0, NOW()),
('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 36.2, 28.0, 78.0, 93.0, NOW() - INTERVAL '2 hours'),
('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 38.0, 27.2, 80.0, 94.0, NOW() - INTERVAL '4 hours');

-- 8. Insert Mandis & Recent Prices
INSERT INTO mandis (id, name, district, state, latitude, longitude)
VALUES 
('77777777-7777-7777-7777-777777770001', 'Pune APMC (Gultekdi)', 'Pune', 'Maharashtra', 18.4975, 73.8643),
('77777777-7777-7777-7777-777777770002', 'Baramati APMC', 'Pune', 'Maharashtra', 18.1517, 74.5772),
('77777777-7777-7777-7777-777777770003', 'Shirur APMC', 'Pune', 'Maharashtra', 18.8256, 74.3789)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mandi_prices (mandi_id, crop_name, price_date, min_price, modal_price, max_price, arrivals_tonnes)
VALUES
('77777777-7777-7777-7777-777777770001', 'Soybean', CURRENT_DATE, 4650, 4850, 5020, 420),
('77777777-7777-7777-7777-777777770002', 'Soybean', CURRENT_DATE, 4800, 5120, 5280, 280),
('77777777-7777-7777-7777-777777770003', 'Soybean', CURRENT_DATE, 4600, 4790, 4910, 190);

-- 9. Insert Farm Expenses
INSERT INTO farm_expenses (farm_id, crop_cycle_id, category, amount, expense_date, notes)
VALUES
('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'SEEDS', 8500, '2026-06-18', 'Certified JS-335 foundation seed bags (75kg)'),
('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'FERTILIZERS', 14200, '2026-06-25', 'Single Super Phosphate (SSP) & Muriate of Potash basal application'),
('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'IRRIGATION_ELECTRICITY', 3800, '2026-07-20', 'MSEDCL Agricultural power tariff and drip filter maintenance'),
('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'LABOR', 9600, '2026-08-05', 'First intercultural weeding & earthing up');
