# Red Show — MVP de Plataforma de Gestión de Eventos

Red Show es una plataforma web diseñada para conectar organizadores de eventos con artistas/emprendedores y propietarios de espacios. Este repositorio contiene la base del MVP funcional, generado en colaboración con V0.app para validar la idea principal del proyecto.

---

## 🎯 Objetivo del Proyecto

El MVP busca validar la utilidad de Red Show mediante una aplicación funcional que permita:

- Registrar usuarios con distintos roles
- Crear perfiles personalizados
- Buscar espacios y servicios
- Coordinar contrataciones
- Calificar experiencias

---

## 🧩 Estructura del MVP

El MVP se divide en módulos independientes, cada uno generado como pantalla en V0.app:

### 1. Registro Inicial (común para todos los usuarios)

Formulario con campos básicos y compartidos:

- Nombre de usuario, email, contraseña
- Tipo de usuario (Dueño / Artista)
- Teléfono, DNI, fecha de nacimiento
- Imagen de perfil
- Ciudad, provincia, barrio
- Disponibilidad (selector de días/horarios)
- Redes sociales: Instagram, TikTok, otras

### 2. Perfil de Dueño de Establecimiento

Formulario exclusivo para propietarios:

- Nombre del negocio, tipo de negocio
- Dirección
- Capacidad, descripción del espacio
- Contacto alternativo
- Horarios de funcionamiento
- Servicios adicionales
- Políticas de contratación
- CUIT/CUIL

### 3. Perfil de Artista / Emprendedor

Formulario exclusivo para artistas/emprendedores:

- Nombre artístico
- Categoría (Músico, Banda, DJ, etc.)
- Años de experiencia
- URL del portfolio
- Breve descripción

### 4. Perfil Público

Cada usuario tiene una versión pública de su perfil, accesible desde el buscador y compartible por URL. Solo incluye información no sensible:

- Para Dueños: nombre del negocio, tipo, ubicación, capacidad, descripción, horarios, servicios, reseñas
- Para Artistas: nombre artístico, categoría, ubicación, experiencia, portfolio, redes sociales, disponibilidad, reseñas

### 5. Buscador de Espacios y Servicios

Pantalla con filtros por ubicación, tipo de evento y categoría. Resultados en tarjetas con imagen, nombre y botón para ver más.

### 6. Mensajería Interna

Interfaz de chat entre usuarios registrados. Permite iniciar conversación desde el perfil público.

### 7. Sistema de Contrataciones

Formulario para solicitar servicios con fecha, hora, tipo y mensaje. Estado de solicitud visible (pendiente, aceptada, rechazada).

### 8. Calificaciones y Reseñas

Interfaz para dejar reseñas públicas con puntuación y comentario. Se muestran en el perfil público del proveedor.

### 9. Panel de Administración

Vista restringida para el equipo de Red Show. Incluye gestión de usuarios, reportes y estadísticas básicas.

---

## 🛠️ Stack Técnico

- **Frontend:** React (generado con V0.app)
- **Backend:** Django + Django REST Framework
- **Modelos principales:**
  - `CustomUser` con roles
  - `EstablishmentOwner` y `ArtistEntrepreneur` como perfiles extendidos
  - `ContractRequest`, `Message`, `Review`
- **Autenticación:** Email y contraseña
- **Diseño responsivo:** Adaptado a desktop y mobile

---

## 🎨 Paleta de Colores

| Elemento UI             | Color sugerido         | Código HEX |
|-------------------------|------------------------|------------|
| Fondo claro             | Marfil suave           | `#FFFCF2`  |
| Color principal         | Azul profundo          | `#001C55`  |
| Color de acento         | Violeta vibrante       | `#B744B8`  |
| Texto principal         | Gris oscuro            | `#2D2D2D`  |
| Éxito / Confirmación    | Verde suave            | `#4CAF50`  |
| Error / Advertencia     | Rojo intenso           | `#C62828`  |
| Fondo alternativo       | Gris claro             | `#F0F0F0`  |

Tipografía sugerida: Inter, Poppins o Roboto. Botones con bordes redondeados y retroalimentación visual clara.
