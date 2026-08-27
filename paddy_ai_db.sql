CREATE DATABASE IF NOT EXISTS paddy_ai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE paddy_ai_db;

-- Create the database user manually and use a strong local password.
-- Example:
-- CREATE USER 'paddyuser'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON paddy_ai_db.* TO 'paddyuser'@'localhost';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('FARMER','ADMIN') NOT NULL DEFAULT 'FARMER',
    location VARCHAR(150) NULL,
    farm_size DECIMAL(10,2) NULL,
    soil_type VARCHAR(50) NULL,
    avatar_color VARCHAR(20) NOT NULL DEFAULT '#2ecc71',
    avatar_image LONGTEXT NULL,
    bio VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS predictions (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    input_data TEXT,
    result TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    image_data LONGTEXT NULL,
    heatmap_data LONGTEXT NULL,
    feedback VARCHAR(20) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pred_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration for existing databases (safe to re-run)
-- Profile data is stored on the authenticated user row, never in one shared browser key.
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(150) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS farm_size DECIMAL(10,2) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS soil_type VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(20) NOT NULL DEFAULT '#2ecc71';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_image LONGTEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(500) NULL;

ALTER TABLE predictions ADD COLUMN IF NOT EXISTS image_data LONGTEXT NULL;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS heatmap_data LONGTEXT NULL;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS feedback VARCHAR(20) NULL;

-- Create the first ADMIN account through the application
-- or insert a BCrypt-hashed password generated locally.

SELECT 'Database setup complete!' AS status;
