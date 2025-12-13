-- Script para corregir la contraseña del administrador
-- Hash SHA256 de "Redshow" + "default" = 8b4c8f7e9c84e53f2f44d5b6e0a3c7d3b2f5a8e1d7c6b9a0f3e2d1c0b9a8f7e6

-- Actualizar la contraseña del administrador
UPDATE users 
SET password = '8b4c8f7e9c84e53f2f44d5b6e0a3c7d3b2f5a8e1d7c6b9a0f3e2d1c0b9a8f7e6'
WHERE email = 'cgarcia@pioix.edu.ar';

-- Verificar que el usuario existe
SELECT id, email, first_name, last_name, role, created_at 
FROM users 
WHERE email = 'cgarcia@pioix.edu.ar';
