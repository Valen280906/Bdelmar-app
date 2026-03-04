-- schema.sql – Esquema MySQL para B DEL MAR 3011
-- Ejecutar con: mysql -u root -p < schema.sql
-- O desde MySQL Workbench: File > Run SQL Script

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS bdelmar
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bdelmar;

-- ============================================================
-- Tabla de configuración de tema
-- ============================================================
CREATE TABLE IF NOT EXISTS theme_config (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    palette_json    JSON         NOT NULL,
    typography_json JSON         NOT NULL,
    active_mode     VARCHAR(20)  NOT NULL DEFAULT 'claro',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_mode CHECK (active_mode IN ('claro','oscuro','daltonico'))
);

-- ============================================================
-- Tabla de usuarios (admin y usuario normal)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,   -- bcrypt hash
    role          VARCHAR(20)  NOT NULL DEFAULT 'user',
    reset_code    VARCHAR(6)   NULL,
    reset_expires DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_role CHECK (role IN ('admin','user'))
);

-- ============================================================
-- Usuarios de demo (contraseñas hasheadas con bcrypt)
-- AdminBdelmar#2026 → hash bcrypt
-- UserBdelmar$2026  → hash bcrypt
-- ============================================================
INSERT IGNORE INTO users (username, email, password, role) VALUES
  ('admin', 'admin@bdelmar.com', '$2a$12$LQv3c1yqBOWBmhQ0lVqXf.djGBZHDgk6HFOU.CGZiCNqXfuZ3YmXe', 'admin'),
  ('user',  'user@bdelmar.com',  '$2a$12$a4PV7jLSUSNu8TMYZCxNDOX5nnF9SJuBZ1YXJT8o2kC9PLZQ4pFhu', 'user');

-- ============================================================
-- Configuración de tema por defecto
-- ============================================================
INSERT INTO theme_config (palette_json, typography_json, active_mode)
SELECT
  '[{"id":1,"name":"Frescura del Mar","active":true,"colors":{"primary":"#1a91db","accent":"#db8b1a","secondary":"#3f8bba","bgPage":"#f0f2f5","bgCard":"#fafafa","textPrimary":"#121212","textSecondary":"#2c3e50","imageBg":"#d4dce4"}},{"id":2,"name":"Modo Oscuro","active":false,"colors":{"primary":"#249be5","accent":"#e59524","secondary":"#4590bf","bgPage":"#121212","bgCard":"#1e1e1e","textPrimary":"#ededed","textSecondary":"#a0aab4","imageBg":"#2a2a2a"}},{"id":3,"name":"Daltonismo","active":false,"colors":{"primary":"#2BB0E6","accent":"#db8b1a","secondary":"#3f8bba","bgPage":"#f0f2f5","bgCard":"#fafafa","textPrimary":"#121212","textSecondary":"#2c3e50","imageBg":"#d4dce4"}}]',
  '{"h1":2.4,"h2":1.6,"h3":1.2,"p":1.0}',
  'claro'
WHERE NOT EXISTS (SELECT 1 FROM theme_config LIMIT 1);
