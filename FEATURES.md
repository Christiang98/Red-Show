# Red Show MVP - Documentación de Funcionalidades

## Características Implementadas

### 1. Sistema de Autenticación
- ✅ Registro de usuarios (Artistas y Dueños de locales)
- ✅ Login con validación de credenciales
- ✅ Logout con limpieza de sesión
- ✅ Validación de contraseñas con requisitos de seguridad
- ✅ Indicador visual de fortaleza de contraseña

### 2. Perfiles de Usuario

#### Perfil de Artista
- ✅ Nombre artístico
- ✅ Categoría (con opción "Otro")
- ✅ Tipo de servicio y rango de precios
- ✅ Biografía y años de experiencia
- ✅ Portfolio con múltiples imágenes
- ✅ Redes sociales (Instagram, TikTok, Otros)
- ✅ Ubicación detallada (ciudad y barrio)
- ✅ Disponibilidad horaria por día de la semana
- ✅ Sistema de publicación (control de visibilidad)

#### Perfil de Dueño de Local
- ✅ Nombre del negocio y tipo (con opción "Otro")
- ✅ Ubicación completa (ciudad, barrio, dirección)
- ✅ Capacidad del espacio
- ✅ Descripción del establecimiento
- ✅ Horarios de funcionamiento por día
- ✅ Redes sociales (Instagram, TikTok, Facebook)
- ✅ Servicios adicionales (sonido, luces, wifi, etc.)
- ✅ Políticas de contratación
- ✅ Imágenes (perfil y destacada)
- ✅ Sistema de publicación (control de visibilidad)

### 3. Sistema de Búsqueda
- ✅ Búsqueda por texto (nombre, categoría, descripción)
- ✅ Filtros por ubicación
- ✅ Filtros por categoría
- ✅ Solo muestra perfiles publicados
- ✅ Vista de resultados con información resumida

### 4. Vista Pública de Perfiles
- ✅ Visualización completa de información
- ✅ Portfolio de imágenes (artistas)
- ✅ Información del establecimiento (dueños)
- ✅ Botón de contratación
- ✅ Botón de mensajería
- ✅ Botón de reporte de usuario
- ✅ Enlaces a redes sociales

### 5. Sistema de Contrataciones
- ✅ Solicitud de contratación
- ✅ Gestión de notificaciones recibidas
- ✅ Gestión de notificaciones enviadas
- ✅ Aceptar/Rechazar contrataciones
- ✅ Habilitación de mensajería al aceptar
- ✅ Estados de contratación (pendiente, aceptado, rechazado)

### 6. Sistema de Mensajería
- ✅ Chat entre usuarios
- ✅ Envío y recepción de mensajes
- ✅ Indicador de mensajes no leídos
- ✅ Solo habilitado después de aceptar contrataciones

### 7. Sistema de Notificaciones
- ✅ Notificaciones en tiempo real
- ✅ Contador de notificaciones no leídas
- ✅ Diferentes tipos de notificaciones
- ✅ Marcar como leído

### 8. Sistema de Reportes
- ✅ Formulario de reporte de usuarios
- ✅ Múltiples motivos de reporte
- ✅ Descripción detallada obligatoria
- ✅ Almacenamiento en base de datos
- ✅ Gestión por administradores

### 9. Sistema de Soporte Técnico
- ✅ Formulario de contacto con soporte
- ✅ Múltiples categorías de problemas
- ✅ Sistema de prioridades
- ✅ Tickets almacenados en base de datos
- ✅ Gestión por administradores
- ✅ Acceso desde navbar

### 10. Panel de Administración
- ✅ Dashboard con estadísticas
- ✅ Gestión de reportes (revisar, resolver, descartar)
- ✅ Gestión de tickets de soporte
- ✅ Gestión de usuarios (verificar, suspender)
- ✅ Vista completa de todos los usuarios
- ✅ Control de perfiles publicados

### 11. Base de Datos
- ✅ SQLite con esquema completo
- ✅ Tablas: users, profiles, artist_profiles, owner_profiles
- ✅ Tablas: events, bookings, messages, reviews, notifications
- ✅ Tablas: reports, support_tickets
- ✅ Índices para optimización
- ✅ Relaciones y constraints

### 12. Navegación
- ✅ Navbar responsive con menú móvil
- ✅ Menú de perfil con dropdown
- ✅ Contador de notificaciones en navbar
- ✅ Enlaces condicionales según autenticación
- ✅ Logout funcional

## Flujo de Usuario Típico

### Para Artistas:
1. Registro como artista
2. Completar perfil con información detallada
3. Publicar perfil
4. Aparecer en búsquedas públicas
5. Recibir solicitudes de contratación
6. Aceptar/Rechazar contrataciones
7. Comunicarse con dueños de locales

### Para Dueños de Locales:
1. Registro como dueño
2. Completar perfil del establecimiento
3. Publicar establecimiento
4. Buscar artistas
5. Enviar solicitudes de contratación
6. Comunicarse con artistas aceptados

### Para Administradores:
1. Acceder a /admin
2. Revisar reportes de usuarios
3. Gestionar tickets de soporte
4. Verificar usuarios
5. Suspender cuentas problemáticas

## Seguridad Implementada

- Validación de contraseñas con requisitos mínimos
- Hashing de contraseñas (bcrypt)
- Autenticación basada en sesiones
- Control de acceso por roles
- Validación de formularios en cliente y servidor
- Protección contra inyección SQL (queries parametrizadas)

## Próximas Mejoras Sugeridas

1. **Sistema de Reviews**: Permitir calificaciones y comentarios después de contrataciones completadas
2. **Sistema de Pagos**: Integrar pagos seguros para reservas
3. **Calendario**: Vista de calendario para disponibilidad de artistas y locales
4. **Verificación de Identidad**: Sistema de verificación más robusto con documentos
5. **Notificaciones Push**: Notificaciones en tiempo real con websockets
6. **Chat en Tiempo Real**: Mejorar el sistema de mensajería con websockets
7. **Galería Avanzada**: Lightbox para imágenes de portfolio
8. **Sistema de Favoritos**: Guardar perfiles favoritos
9. **Búsqueda Avanzada**: Más filtros y ordenamiento
10. **Analytics**: Dashboard de estadísticas para artistas y dueños
11. **Email Notifications**: Envío de correos para eventos importantes
12. **Multi-idioma**: Soporte para español e inglés
13. **Modo Oscuro**: Toggle para tema oscuro
14. **Exportación de Datos**: Permitir a usuarios exportar su información
15. **API REST Pública**: Para integraciones de terceros

## Notas Técnicas

- Framework: Next.js 15 con App Router
- Base de Datos: SQLite3
- Autenticación: Custom con localStorage
- Estilos: Tailwind CSS v4
- Componentes: shadcn/ui
- Validación: Cliente y servidor
- Responsive: Mobile-first design

## Comandos Útiles

### Crear Usuario Admin (en SQLite)
\`\`\`sql
INSERT INTO users (email, password, first_name, last_name, role) 
VALUES ('admin@redshow.com', 'hashed_password', 'Admin', 'Red Show', 'admin');
\`\`\`

### Verificar Perfiles Publicados
\`\`\`sql
SELECT u.email, ap.stage_name, ap.is_published FROM users u
LEFT JOIN artist_profiles ap ON u.id = ap.user_id
WHERE ap.is_published = 1;
\`\`\`

### Ver Reportes Pendientes
\`\`\`sql
SELECT * FROM reports WHERE status = 'pending';
