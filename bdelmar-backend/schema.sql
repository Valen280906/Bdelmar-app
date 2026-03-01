-- schema.sql – Esquema para B DEL MAR 3011
-- Ejecutar con: psql -U postgres -d bdelmar -f schema.sql

-- Crear base de datos (ejecutar como superusuario si no existe)
-- CREATE DATABASE bdelmar;

-- Tabla de configuración de tema
CREATE TABLE IF NOT EXISTS theme_config (
    id              SERIAL PRIMARY KEY,
    palette_json    JSONB        NOT NULL DEFAULT '[]',
    typography_json JSONB        NOT NULL DEFAULT '{}',
    active_mode     VARCHAR(20)  NOT NULL DEFAULT 'claro' CHECK (active_mode IN ('claro','oscuro','daltonico')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Insertar configuración por defecto
INSERT INTO theme_config (palette_json, typography_json, active_mode)
VALUES (
    '[{"id":1,"name":"Frescura del Mar","active":true,"colors":{"primary":"#1a91db","accent":"#db8b1a","secondary":"#3f8bba","bgPage":"#f0f2f5","bgCard":"#fafafa","textPrimary":"#121212","textSecondary":"#2c3e50","imageBg":"#d4dce4"}},{"id":2,"name":"Modo Oscuro","active":false,"colors":{"primary":"#249be5","accent":"#e59524","secondary":"#4590bf","bgPage":"#121212","bgCard":"#1e1e1e","textPrimary":"#ededed","textSecondary":"#a0aab4","imageBg":"#2a2a2a"}},{"id":3,"name":"Daltonismo","active":false,"colors":{"primary":"#2BB0E6","accent":"#db8b1a","secondary":"#3f8bba","bgPage":"#f0f2f5","bgCard":"#fafafa","textPrimary":"#121212","textSecondary":"#2c3e50","imageBg":"#d4dce4"}}]'::jsonb,
    '{"h1":2.4,"h2":1.6,"h3":1.2,"p":1.0}'::jsonb,
    'claro'
)
ON CONFLICT DO NOTHING;
