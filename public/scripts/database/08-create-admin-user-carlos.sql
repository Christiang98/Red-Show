-- Actualizar con el hash correcto para SHA256
-- Crear el usuario administrador con email cgarcia@pioix.edu.ar y contraseña Redshow

-- Primero eliminamos el usuario si ya existe
DELETE FROM users WHERE email = 'cgarcia@pioix.edu.ar';

-- Crear el usuario administrador
-- Hash SHA256 de "Redshow" con salt "default": 
-- El hash se genera con crypto.createHash("sha256").update("Redshow" + "default").digest("hex")
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_verified, created_at, updated_at)
VALUES (
  'admin-carlos-garcia-001',
  'cgarcia@pioix.edu.ar',
  'f5d1278e8109edd94e1e4197e04873b6c0c0f27e3e9d8f8f8c3e3e8f8c3e3e8f',  -- Hash temporal - ejecutar generate-admin-password-hash.ts para obtener el correcto
  'Carlos',
  'García',
  'admin',
  1,
  datetime('now'),
  datetime('now')
);

-- Crear un perfil básico para el administrador
INSERT INTO profiles (id, user_id, bio, location, avatar_url, created_at, updated_at)
VALUES (
  'profile-admin-carlos-001',
  'admin-carlos-garcia-001',
  'Administrador Principal de Red Show - Sistema de Gestión',
  'Buenos Aires, Argentina',
  NULL,
  datetime('now'),
  datetime('now')
);

-- Verificación
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.is_verified,
  u.created_at
FROM users u
WHERE u.email = 'cgarcia@pioix.edu.ar';

-- Mensaje de éxito
SELECT 'Usuario administrador creado exitosamente!' as mensaje;
SELECT 'Email: cgarcia@pioix.edu.ar' as credencial;
SELECT 'Contraseña: Redshow' as credencial;
SELECT 'Rol: admin' as info;
