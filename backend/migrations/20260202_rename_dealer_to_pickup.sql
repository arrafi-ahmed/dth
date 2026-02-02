-- Migration: Rename dealer_name to pickup_location 
-- Date: 2026-02-02

ALTER TABLE loads RENAME COLUMN dealer_name TO pickup_location;
