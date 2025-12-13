-- Script para actualizar credenciales del administrador
-- Email: cgarcia@pioix.edu.ar
-- Contraseña: Redshow
-- Hash generado con SHA256 + salt 'default'

-- Eliminar usuarios admin existentes
DELETE FROM users WHERE email IN ('admin@redshow.com', 'cgarcia@pioix.edu.ar');

-- Crear usuario administrador con credenciales actualizadas
-- Hash para 'Redshow' con salt 'default': 64c5f35e9937c1de71ae8ac5ea99c79fd9c2a00f82e6c03bb0876c0b8b35b5b8
INSERT INTO users (email, password, first_name, last_name, role, phone, created_at)
VALUES (
  'cgarcia@pioix.edu.ar',
  '64c5f35e9937c1de71ae8ac5ea99c79fd9c2a00f82e6c03bb0876c0b8b35b5b8',
  'Cristian',
  'García',
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
FROM users WHERE email = 'cgarcia@pioix.edu.ar';

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
