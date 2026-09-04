-- Migration: Add previous crop, yield history, and report name to soil_records
ALTER TABLE IF EXISTS soil_records
ADD COLUMN IF NOT EXISTS previous_crop VARCHAR(100),
ADD COLUMN IF NOT EXISTS previous_yield_quintals NUMERIC(8, 2),
ADD COLUMN IF NOT EXISTS previous_season VARCHAR(20),
ADD COLUMN IF NOT EXISTS report_name VARCHAR(255);
