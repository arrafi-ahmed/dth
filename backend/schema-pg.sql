-- Database schema for DTH Logistics

CREATE TABLE app_user
(
    id         SERIAL PRIMARY KEY,
    full_name  VARCHAR(255),
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       SMALLINT CHECK (role IN (20, 40)),
    id_document VARCHAR(255),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verified_by INT REFERENCES app_user (id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    timezone VARCHAR(100) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_settings
(
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL UNIQUE REFERENCES app_user (id) ON DELETE CASCADE,
    theme      VARCHAR(20) NOT NULL DEFAULT 'dark',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE footer_settings 
(
    id SERIAL PRIMARY KEY,
    style VARCHAR(20) NOT NULL DEFAULT 'expanded' CHECK (style IN ('oneline', 'expanded')),
    company_name VARCHAR(255),
    company_address TEXT,
    company_email VARCHAR(255),
    company_phone VARCHAR(50),
    quick_links JSONB DEFAULT '[]',
    social_links JSONB DEFAULT '{}',
    copyright_text VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE header_settings 
(
    id SERIAL PRIMARY KEY,
    logo_image VARCHAR(255),
    logo_image_dark VARCHAR(255),
    logo_position VARCHAR(20) NOT NULL DEFAULT 'left' CHECK (logo_position IN ('left', 'center', 'right')),
    menu_position VARCHAR(20) NOT NULL DEFAULT 'right' CHECK (menu_position IN ('left', 'center', 'right')),
    logo_width_left INT DEFAULT 300,
    logo_width_center INT DEFAULT 180,
    logo_width_mobile INT DEFAULT 120,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE password_reset_requests
(
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    used       BOOLEAN      DEFAULT false,
    created_at TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE appearance_settings
(
    id              SERIAL PRIMARY KEY,
    default_theme   VARCHAR(20) NOT NULL DEFAULT 'dark' CHECK (default_theme IN ('dark', 'light')),
    light_colors    JSONB       NOT NULL DEFAULT '{}'::jsonb,
    light_variables JSONB       NOT NULL DEFAULT '{}'::jsonb,
    dark_colors     JSONB       NOT NULL DEFAULT '{}'::jsonb,
    dark_variables  JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loads
(
    id                  SERIAL PRIMARY KEY,
    load_id             VARCHAR(50) NOT NULL UNIQUE,
    pickup_location     VARCHAR(255) NOT NULL,
    vehicle_year        INT,
    vehicle_make        VARCHAR(100),
    vehicle_model       VARCHAR(100),
    vin_last_6          VARCHAR(6),
    carrier_name        VARCHAR(255),
    driver_name         VARCHAR(255),
    driver_license_info TEXT,
    driver_photo        VARCHAR(255),
    truck_plate         VARCHAR(50),
    trailer_plate       VARCHAR(50),
    pickup_window_start TIMESTAMPTZ,
    pickup_window_end   TIMESTAMPTZ,
    pin                 VARCHAR(10) NOT NULL,
    verification_token  UUID UNIQUE,
    status              VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'VALID', 'USED', 'EXPIRED', 'VOID')),
    created_by          INT REFERENCES app_user (id) ON DELETE SET NULL,
    pickup_info         TEXT,
    pickup_contact      VARCHAR(255),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE load_logs
(
    id         SERIAL PRIMARY KEY,
    load_id    INT NOT NULL REFERENCES loads (id) ON DELETE CASCADE,
    action     VARCHAR(50) NOT NULL,
    details    JSONB DEFAULT '{}'::jsonb,
    user_id    INT REFERENCES app_user (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings (user_id);
CREATE INDEX idx_password_reset_requests_token ON password_reset_requests (token);
CREATE INDEX idx_password_reset_requests_email ON password_reset_requests (email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_appearance_settings_singleton ON appearance_settings ((1));
CREATE UNIQUE INDEX IF NOT EXISTS idx_header_settings_singleton ON header_settings ((1));
CREATE UNIQUE INDEX IF NOT EXISTS idx_footer_settings_singleton ON footer_settings ((1));

-- Load Indexes
CREATE INDEX IF NOT EXISTS idx_loads_load_id ON loads (load_id);
CREATE INDEX IF NOT EXISTS idx_loads_verification_token ON loads (verification_token);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads (status);
CREATE INDEX IF NOT EXISTS idx_loads_vin_last_6 ON loads (vin_last_6);
CREATE INDEX IF NOT EXISTS idx_load_logs_load_id ON load_logs (load_id);
