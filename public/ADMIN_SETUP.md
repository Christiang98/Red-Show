# Configuración del Usuario Administrador

## Credenciales del Administrador

- **Email:** cgarcia@pioix.edu.ar
- **Contraseña:** Redshow
- **Rol:** admin

## Pasos para crear el usuario administrador

1. **Generar el hash de la contraseña:**
   \`\`\`bash
   # Ejecutar este script de Node.js
   node scripts/generate-admin-password-hash.ts
   \`\`\`
   
   Esto generará el hash SHA256 de la contraseña "Redshow" que debes copiar.

2. **Actualizar el script SQL:**
   Abre el archivo `scripts/database/08-create-admin-user-carlos.sql` y reemplaza el hash temporal con el hash generado en el paso anterior.

3. **Ejecutar el script SQL:**
   Ejecuta el script SQL en tu base de datos para crear el usuario administrador.

4. **Iniciar sesión:**
   - Ve a `/login`
   - Ingresa: cgarcia@pioix.edu.ar
   - Contraseña: Redshow
   - Serás redirigido automáticamente al panel de administración en `/admin`

## Funcionalidades del Panel de Administración

### 1. Gestión de Usuarios
- Ver todos los usuarios registrados
- Ver roles (artist, owner, admin)
- Ver qué perfiles están publicados
- Verificar/desverificar usuarios
- Suspender cuentas

### 2. Gestión de Contrataciones
- Ver todas las contrataciones de la plataforma
- Ver estado (pending, accepted, rejected, completed, cancelled)
- Ver información del artista y dueño
- Marcar contrataciones como completadas
- Cancelar contrataciones

### 3. Gestión de Reportes
- Ver reportes de usuarios sobre otros usuarios
- Ver motivo y descripción del reporte
- Cambiar estado: pending → under_review → resolved/dismissed
- Agregar notas administrativas

### 4. Gestión de Soporte Técnico
- Ver tickets de soporte de usuarios
- Ver categoría, prioridad y mensaje
- Cambiar estado: open → in_progress → resolved/closed
- Responder a los tickets

### 5. Estadísticas
- Total de usuarios
- Reportes pendientes
- Tickets abiertos
- Contrataciones activas
- Perfiles publicados

## Acceso Restringido

Solo usuarios con `role = 'admin'` pueden acceder al panel de administración. Si un usuario no administrador intenta acceder a `/admin`, será redirigido al dashboard con un mensaje de error.

## Seguridad

- Las contraseñas están hasheadas con SHA256
- El panel requiere autenticación
- Las acciones críticas requieren confirmación
- Los logs se registran en la consola para auditoría
