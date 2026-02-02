-- Migration: Create form_field_configs and pdf_settings tables
-- Created: 2026-02-02

CREATE TABLE IF NOT EXISTS form_field_configs (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL DEFAULT 'CORE',
    field_key VARCHAR(100) NOT NULL UNIQUE,
    input_type VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    label VARCHAR(255) NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    is_required BOOLEAN DEFAULT FALSE,
    show_on_pdf BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdf_settings (
    id SERIAL PRIMARY KEY,
    disclaimer_text TEXT,
    support_phone VARCHAR(50),
    support_email VARCHAR(255),
    logo_height INTEGER DEFAULT 130,
    header_title VARCHAR(255) DEFAULT 'VEHICLE RELEASE AUTHORIZATION',
    qr_code_size INTEGER DEFAULT 120,
    footer_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Core Fields
INSERT INTO form_field_configs (type, field_key, input_type, label, is_visible, is_required, show_on_pdf, display_order)
VALUES 
    ('CORE', 'loadId', 'TEXT', 'Load ID / Order Number', true, false, true, 10),
    ('CORE', 'pickupLocation', 'TEXT', 'Pickup Location', true, true, true, 20),
    ('CORE', 'vehicleYear', 'NUMBER', 'Vehicle Year', true, true, true, 30),
    ('CORE', 'vehicleMake', 'TEXT', 'Vehicle Make', true, true, true, 40),
    ('CORE', 'vehicleModel', 'TEXT', 'Vehicle Model', true, true, true, 50),
    ('CORE', 'vinLast6', 'TEXT', 'VIN (Last 6)', true, true, true, 60),
    ('CORE', 'carrierName', 'TEXT', 'Carrier Name', true, false, true, 70),
    ('CORE', 'driverName', 'TEXT', 'Driver Name', true, false, true, 80),
    ('CORE', 'driverLicenseInfo', 'TEXT', 'Driver License Info', true, false, true, 90),
    ('CORE', 'truckPlate', 'TEXT', 'Truck Plate', true, false, true, 100),
    ('CORE', 'trailerPlate', 'TEXT', 'Trailer Plate', true, false, true, 110),
    ('CORE', 'pickupInfo', 'TEXTAREA', 'Pickup Information', true, false, true, 120),
    ('CORE', 'pickupContact', 'TEXT', 'Pickup Contact', true, false, true, 130),
    ('CORE', 'pickupWindowStart', 'TEXT', 'Pickup Window Start', true, false, true, 140),
    ('CORE', 'pickupWindowEnd', 'TEXT', 'Pickup Window End', true, false, true, 150)
ON CONFLICT (field_key) DO NOTHING;

-- Seed Default PDF Settings if empty
INSERT INTO pdf_settings (
    disclaimer_text, 
    support_phone, 
    support_email
)
SELECT 
    'The carrier is responsible for verifying all vehicle details before release.', 
    '713-303-8890', 
    'dispatch@DTHLogistics.com'
WHERE NOT EXISTS (SELECT 1 FROM dth.public.pdf_settings LIMIT 1);
