-- Migration: Sync local schema changes to production
-- Date: 2026-02-11

-- Add custom_fields to loads table
ALTER TABLE loads ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add check constraints to form_field_configs if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_field_configs_type_check') THEN
        ALTER TABLE form_field_configs ADD CONSTRAINT form_field_configs_type_check CHECK (type IN ('CORE', 'CUSTOM'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_field_configs_input_type_check') THEN
        ALTER TABLE form_field_configs ADD CONSTRAINT form_field_configs_input_type_check CHECK (input_type IN ('TEXT', 'TEXTAREA', 'NUMBER'));
    END IF;
END $$;

-- Ensure singleton index for pdf_settings (might be missing in some environments)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pdf_settings_singleton ON pdf_settings ((1));
