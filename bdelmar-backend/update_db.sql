-- Guía para actualizar tu base de datos existente 
-- Puedes ejecutar este archivo con el siguiente comando en tu terminal:
-- mysql -u root -p < "c:\Users\Valentina\Documents\8ctavo semestre\Interfaces de usuario\B-del-Mar\bdelmar-backend\update_db.sql"

USE bdelmar;

-- Desactivar modo seguro
SET @OLD_SQL_SAFE_UPDATES=@@SQL_SAFE_UPDATES, SQL_SAFE_UPDATES=0;

-- Crear tabla de combos globales
CREATE TABLE IF NOT EXISTS combos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    unit        VARCHAR(50)  NOT NULL,
    price       DECIMAL(10,2) NOT NULL
);

-- Crear tabla pivote para relacionar ambas
CREATE TABLE IF NOT EXISTS product_combos (
    product_id  INT NOT NULL,
    combo_id    INT NOT NULL,
    PRIMARY KEY (product_id, combo_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE
);

-- Sembrar un combo base si no hay nada
INSERT IGNORE INTO combos (id, name, unit, price) VALUES (1, 'Combo Primaveral', '10 Kilos', 50.00);

-- Crear tabla de cupones
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2) DEFAULT 0.00,
    max_uses INT DEFAULT 0,
    uses_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ignorando los atributos planos antiguos (Si no los usaste o fallaron antes, esto no romperá nada)

-- Restaurar modo seguro
SET SQL_SAFE_UPDATES=@OLD_SQL_SAFE_UPDATES;
