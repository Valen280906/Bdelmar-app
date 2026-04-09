-- ============================================================
-- fix_db.sql – Corrección de BD y nuevo sistema de cupones
-- Ejecutar con: mysql -u root -p bdelmar < fix_db.sql
-- ============================================================
USE bdelmar;
SET @OLD_SQL_SAFE_UPDATES=@@SQL_SAFE_UPDATES, SQL_SAFE_UPDATES=0;

-- ─── FIXES PREVIOS YA APLICADOS ───
-- La columna barcode en products ya se agregó exitosamente.
-- La columna product_id en combos ya existe.

-- ─── NUEVO SISTEMA DE CUPONES ─────────────────────────────────────────────
-- Primero eliminar la tabla vieja si existe (o agregar columnas si ya existe)
-- Opción segura: agregar columnas nuevas si no existen

-- ALTER TABLE coupons
--   ADD COLUMN coupon_category VARCHAR(20) NOT NULL DEFAULT 'promo_code' AFTER code,
--   ADD COLUMN discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' AFTER value,
--   ADD COLUMN description TEXT NULL AFTER discount_type,
--   ADD COLUMN special_days JSON NULL COMMENT 'Array de dias: [0=Dom,1=Lun,...,6=Sab]' AFTER description,
--   ADD COLUMN required_purchases INT NOT NULL DEFAULT 3 COMMENT 'Para tipo purchase_count: cuantas compras del mes' AFTER special_days;

-- Renombrar type a old_type si existe (puede dar error si ya lo renombramos, ignorar)
-- ALTER TABLE coupons CHANGE COLUMN type old_type VARCHAR(20) NULL;

-- ─── NUEVA TABLA: user_coupons ────────────────────────────────────────────
-- Sirve para:
-- 1. Rastrear qué cupones tiene cada usuario (asignados/canjeados)
-- 2. Garantizar que cada cupón solo se use UNA VEZ por usuario
-- 3. (Para purchase_count) rastrear # de compras del mes como purchase_count
CREATE TABLE IF NOT EXISTS user_coupons (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    coupon_id     INT NOT NULL,
    is_used       BOOLEAN NOT NULL DEFAULT FALSE,
    used_at       DATETIME NULL,
    assigned_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_coupon (user_id, coupon_id)
);

-- ─── NUEVA TABLA: user_purchase_log ──────────────────────────────────────
-- Registra cada compra completada por usuario para el contador mensual
CREATE TABLE IF NOT EXISTS user_purchase_log (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    order_ref     VARCHAR(50) NOT NULL COMMENT 'ID de orden (del store frontend)',
    amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
    purchased_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── STOCK PARA PRODUCTOS ────────────────────────────────────────────────────
-- Agregar columna de stock disponible en kilos al catálogo de productos
ALTER TABLE products
  ADD COLUMN stock DECIMAL(10,2) NOT NULL DEFAULT 0.00
    COMMENT 'Stock disponible en kilogramos. Si es 0, el producto se considera sin límite de stock configurado.';

-- Restaurar modo seguro
SET SQL_SAFE_UPDATES=@OLD_SQL_SAFE_UPDATES;

SELECT 'fix_db.sql ejecutado exitosamente. BD actualizada.' AS resultado;
