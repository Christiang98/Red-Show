-- Script para crear usuario administrador con hash correcto
-- Contraseña: admin123
-- Hash generado con SHA256 + salt 'default'

-- Eliminar usuario admin existente si lo hay
DELETE FROM users WHERE email = 'admin@redshow.com';

-- Crear usuario administrador con hash SHA256 correcto
-- Hash para 'admin123' con salt 'default'
INSERT INTO users (email, password, first_name, last_name, role, phone, created_at)
VALUES (
  'admin@redshow.com',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'Administrador',
  'Red Show',
  'admin',
  '+54 11 1234-5678',
  datetime('now')
);

-- Crear perfil básico para el admin
INSERT INTO profiles (user_id, bio, location, verified, created_at)
SELECT 
  id,
  'Administrador del sistema Red Show',
  'Buenos Aires, Argentina',
  1,
  datetime('now')
FROM users WHERE email = 'admin@redshow.com';

-- Verificar que se creó correctamente
SELECT 
  u.id, 
  u.email, 
  u.first_name, 
  u.last_name, 
  u.role,
  u.password as password_hash,
  p.bio, 
  p.location,
  p.verified
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.role = 'admin';
