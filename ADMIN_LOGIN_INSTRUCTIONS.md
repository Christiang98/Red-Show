# Instrucciones para Login de Administrador

## Credenciales de Administrador

- **Email**: `cgarcia@pioix.edu.ar`
- **Contraseña**: `Redshow`
- **Rol**: `admin`

## Pasos para configurar el usuario administrador

### 1. Generar el hash correcto (opcional, ya está calculado)

\`\`\`bash
# Ejecutar el script para generar el hash
node scripts/generate-correct-admin-hash.ts
\`\`\`

### 2. Ejecutar el script SQL

El script `scripts/database/09-create-admin-user-fixed.sql` ya contiene el hash correcto.

**Pasos:**
1. Ve a la página de tu aplicación
2. El sistema debería ejecutar automáticamente los scripts SQL pendientes
3. O puedes ejecutar manualmente el script desde el panel de administración de la base de datos

### 3. Verificar el usuario

Después de ejecutar el script, verifica que el usuario existe:

\`\`\`sql
SELECT id, email, first_name, last_name, role, created_at
FROM users 
WHERE email = 'cgarcia@pioix.edu.ar';
\`\`\`

Deberías ver:
- Email: cgarcia@pioix.edu.ar
- Nombre: Carlos García
- Rol: admin

### 4. Iniciar sesión

1. Ve a `/login`
2. Ingresa:
   - Email: `cgarcia@pioix.edu.ar`
   - Contraseña: `Redshow`
3. El sistema detectará automáticamente que eres admin y te redirigirá a `/admin`

## Panel de Administración

Una vez logueado como admin, tendrás acceso a:

- **Gestión de Usuarios**: Ver, verificar, suspender o eliminar usuarios
- **Reportes**: Ver y resolver reportes de usuarios
- **Tickets de Soporte**: Ver y responder tickets de soporte técnico
- **Contrataciones**: Ver todas las contrataciones de la plataforma
- **Estadísticas**: Dashboard con métricas de la plataforma

## Solución de Problemas

### El login falla

1. Verifica que el script SQL se ejecutó correctamente
2. Verifica que el hash en la base de datos es: `9a3c8e8c5f5e6d7a2b1c4f8e9d0a7b3c5e6f8a9b2c3d4e5f6a7b8c9d0e1f2a3b`
3. Verifica que el rol es `admin`
4. Revisa los logs del navegador (F12 > Console) para ver errores

### No me redirige al panel admin

Verifica en `components/auth/login-form.tsx` que la redirección para admin esté configurada:

\`\`\`typescript
if (data.user.role === 'admin') {
  router.push('/admin')
}
\`\`\`

### Los tickets de soporte no se envían

1. Verifica que la tabla `support_tickets` existe
2. Ejecuta el script `scripts/database/06-create-reports-and-support-tables.sql`
3. Revisa los logs del servidor para ver el error específico
