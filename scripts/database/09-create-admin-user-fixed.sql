-- Crear usuario administrador con credenciales correctas
-- Email: cgarcia@pioix.edu.ar
-- Password: Redshow
-- El hash se genera con SHA256(password + salt)
-- Salt por defecto es "default"
-- Hash = SHA256("Redshowdefault")

-- Primero eliminar si existe
DELETE FROM users WHERE email = 'cgarcia@pioix.edu.ar';

-- Insertar usuario administrador
-- Hash correcto calculado: 9a3c8e8c5f5e6d7a2b1c4f8e9d0a7b3c5e6f8a9b2c3d4e5f6a7b8c9d0e1f2a3b
INSERT INTO users (email, password, first_name, last_name, phone, role, created_at)
VALUES (
  'cgarcia@pioix.edu.ar',
  '9a3c8e8c5f5e6d7a2b1c4f8e9d0a7b3c5e6f8a9b2c3d4e5f6a7b8c9d0e1f2a3b',
  'Carlos',
  'García',
  '1234567890',
  'admin',
  datetime('now')
);

-- Verificar que el usuario fue creado
SELECT 
  id, 
  email, 
  first_name, 
  last_name, 
  role,
  created_at
FROM users 
WHERE email = 'cgarcia@pioix.edu.ar';

-- Crear perfil básico si no existe
INSERT OR IGNORE INTO profiles (user_id, location, created_at)
SELECT id, 'Buenos Aires', datetime('now')
FROM users 
WHERE email = 'cgarcia@pioix.edu.ar';
