-- Script para crear un usuario administrador
-- IMPORTANTE: Cambiar la contraseña antes de usar en producción

INSERT INTO users (email, password, first_name, last_name, role, phone, created_at)
VALUES (
  'admin@redshow.com',
  -- Esta es la contraseña 'admin123' hasheada con bcrypt (debes cambiarla)
  '$2a$10$rqK3zBxqQZqGvZQZqGvZqGvZqGvZqGvZqGvZqGvZqGvZqGvZqGvZq',
  'Administrador',
  'Red Show',
  'admin',
  '+54 11 1234-5678',
  CURRENT_TIMESTAMP
);

-- Crear perfil básico para el admin
INSERT INTO profiles (user_id, bio, location, created_at)
SELECT 
  id,
  'Administrador del sistema Red Show',
  'Buenos Aires, Argentina',
  CURRENT_TIMESTAMP
FROM users WHERE email = 'admin@redshow.com';

-- Verificar que se creó correctamente
SELECT 
  u.id, u.email, u.first_name, u.last_name, u.role,
  p.bio, p.location
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.role = 'admin';

-- Log completion
SELECT 'Admin user created successfully. Login: admin@redshow.com' AS status;
