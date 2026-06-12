-- =====================================================
-- EJECUTAR ESTE SCRIPT EN PHPMYADMIN
-- =====================================================
-- Instrucciones:
-- 1. Abrir http://localhost/phpmyadmin
-- 2. Seleccionar la base de datos: sweetbites_db
-- 3. Click en pestaña "SQL"
-- 4. Copiar TODO este archivo y pegar
-- 5. Click en "Continuar"
-- =====================================================

USE sweetbites_db;

-- Agregar campos para recetas especiales
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS destacada BOOLEAN DEFAULT FALSE COMMENT 'Receta destacada',
ADD COLUMN IF NOT EXISTS receta_semana BOOLEAN DEFAULT FALSE COMMENT 'Receta de la semana',
ADD COLUMN IF NOT EXISTS temporada ENUM('verano', 'otoño', 'invierno', 'primavera', 'todas') DEFAULT 'todas' COMMENT 'Temporada',
ADD COLUMN IF NOT EXISTS dieta_especial ENUM('sin_gluten', 'vegana', 'vegetariana', 'sin_lactosa', 'sin_azucar', 'ninguna') DEFAULT 'ninguna' COMMENT 'Dieta especial';

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_destacada ON recipes(destacada);
CREATE INDEX IF NOT EXISTS idx_receta_semana ON recipes(receta_semana);
CREATE INDEX IF NOT EXISTS idx_temporada ON recipes(temporada);
CREATE INDEX IF NOT EXISTS idx_dieta_especial ON recipes(dieta_especial);

-- Verificar que se agregaron los campos
SHOW COLUMNS FROM recipes;

-- Resultado
SELECT '✅ CAMPOS AGREGADOS EXITOSAMENTE!' AS RESULTADO;
SELECT 'Ahora puedes cerrar phpMyAdmin y volver a Claude Code' AS SIGUIENTE_PASO;
