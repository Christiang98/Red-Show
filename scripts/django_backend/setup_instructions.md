# Instrucciones de Setup - Django Backend Red Show

## Requisitos Previos
- Python 3.10+
- PostgreSQL instalado y ejecutándose
- pip instalado

## Paso 1: Crear Proyecto Django

\`\`\`bash
# Crear directorio del proyecto
mkdir red_show_backend
cd red_show_backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
\`\`\`

## Paso 2: Crear Base de Datos PostgreSQL

\`\`\`bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE red_show_db;
CREATE USER red_show_user WITH PASSWORD 'your_secure_password';
ALTER ROLE red_show_user SET client_encoding TO 'utf8';
ALTER ROLE red_show_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE red_show_user SET default_transaction_deferrable TO on;
ALTER ROLE red_show_user SET default_transaction_read_committed TO off;
ALTER ROLE red_show_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE red_show_db TO red_show_user;
\`\`\`

## Paso 3: Configurar Django

\`\`\`bash
# Crear app
django-admin startproject red_show .
django-admin startapp api

# Copiar archivos proporcionados:
# - settings.py → red_show/settings.py
# - models.py → api/models.py
# - serializers.py → api/serializers.py
# - views.py → api/views.py
# - urls.py → red_show/urls.py
\`\`\`

## Paso 4: Actualizar settings.py

Modificar las credenciales de PostgreSQL:
\`\`\`python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'red_show_db',
        'USER': 'red_show_user',
        'PASSWORD': 'your_secure_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
\`\`\`

## Paso 5: Ejecutar Migraciones

\`\`\`bash
python manage.py migrate
python manage.py createsuperuser  # Crear admin
\`\`\`

## Paso 6: Iniciar Servidor

\`\`\`bash
python manage.py runserver 8000
\`\`\`

## URLs Disponibles

\`\`\`
Registro: POST http://localhost:8000/api/auth/register/
Login: POST http://localhost:8000/api/auth/login/
Perfil: GET http://localhost:8000/api/profiles/me/
Eventos: GET/POST http://localhost:8000/api/events/
Búsqueda: GET http://localhost:8000/api/events/search/
Reservas: GET/POST http://localhost:8000/api/bookings/
Mensajes: GET/POST http://localhost:8000/api/messages/
Reseñas: GET/POST http://localhost:8000/api/reviews/
