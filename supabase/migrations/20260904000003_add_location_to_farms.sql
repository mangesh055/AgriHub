-- Migration: Add village, taluka, district, state, and location_name to farms
ALTER TABLE IF EXISTS farms
ADD COLUMN IF NOT EXISTS village VARCHAR(100),
ADD COLUMN IF NOT EXISTS taluka VARCHAR(100),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);
