-- Migration: Add Pickup Info and Pickup Contact to loads table
-- Date: 2026-02-02

ALTER TABLE loads ADD COLUMN IF NOT EXISTS pickup_info TEXT;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS pickup_contact VARCHAR(255);
