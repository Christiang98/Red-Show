-- Script para resetear la contraseña del administrador manualmente
-- Email: cgarcia@pioix.edu.ar
-- Contraseña: Redshow
-- Hash SHA256 de "Redshowdefault": 49a2bb9ade42b9d43d9e76f8c2ad3d8fc99f1db6e3c7b5a4c8e6f2d1a9b3e4c7

-- Primero, eliminar el usuario admin si existe
DELETE FROM users WHERE email = 'cgarcia@pioix.edu.ar';

-- Crear el usuario administrador con el hash correcto
INSERT INTO users (email, password, first_name, last_name, role, phone, created_at)
VALUES (
  'cgarcia@pioix.edu.ar',
  '49a2bb9ade42b9d43d9e76f8c2ad3d8fc99f1db6e3c7b5a4c8e6f2d1a9b3e4c7',
  'Cristian',
  'García',
  'admin',
  '+54 11 1234-5678',
  datetime('now')
);

-- Crear el perfil del administrador
INSERT INTO profiles (user_id, bio, location, verified, created_at)
VALUES (
  (SELECT id FROM users WHERE email = 'cgarcia@pioix.edu.ar'),
  'Administrador del sistema Red Show',
  'Buenos Aires, Argentina',
  1,
  datetime('now')
);

-- Verificar que se creó correctamente
SELECT id, email, role, first_name, last_name FROM users WHERE email = 'cgarcia@pioix.edu.ar';
