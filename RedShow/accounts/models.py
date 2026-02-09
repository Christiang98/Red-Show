from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator


# -------------------------
# Usuario Personalizado
# -------------------------
class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = [
        ('owner', 'Dueño de Establecimiento'),
        ('artist', 'Artista/Emprendedor'),
    ]

    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        verbose_name="Tipo de Usuario"
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Formato de teléfono inválido"
        )],
        verbose_name="Teléfono"
    )
    dni = models.CharField(max_length=20, blank=True, verbose_name="DNI")
    profile_image = models.ImageField(
        upload_to='profiles/',
        blank=True,
        verbose_name="Imagen de Perfil"
    )
    birth_date = models.DateField(blank=True, null=True, verbose_name="Fecha de Nacimiento")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


# -------------------------
# Dueño de Establecimiento
# -------------------------
class EstablishmentOwner(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='owner_profile'
    )
    business_name = models.CharField(max_length=200, verbose_name="Nombre del Negocio")
    business_type = models.CharField(max_length=100, verbose_name="Tipo de Negocio")
    address = models.TextField(verbose_name="Dirección")
    city = models.CharField(max_length=100, blank=True)
    province = models.CharField(max_length=100, blank=True)
    capacity = models.IntegerField(verbose_name="Capacidad")
    description = models.TextField(blank=True, verbose_name="Descripción")
    contact_alt = models.CharField(max_length=100, blank=True, verbose_name="Contacto Alternativo")

    # Cambié a JSONField para horarios
    schedule = models.JSONField(blank=True, null=True, verbose_name="Horarios de Funcionamiento")

    # JSONField para servicios adicionales
    additional_services = models.JSONField(blank=True, null=True, verbose_name="Servicios Adicionales")
    
    hiring_policies = models.TextField(blank=True, verbose_name="Políticas de Contratación")
    cuit_cuil = models.CharField(
        max_length=13,
        blank=True,
        validators=[RegexValidator(
            regex=r'^\d{2}-\d{8}-\d{1}$',
            message="Formato CUIT/CUIL: XX-XXXXXXXX-X"
        )],
        verbose_name="CUIT/CUIL"
    )

    def __str__(self):
        return f"{self.business_name} - {self.user.get_full_name()}"

    class Meta:
        verbose_name = "Propietario de Establecimiento"
        verbose_name_plural = "Propietarios de Establecimientos"


# -------------------------
# Artista / Emprendedor
# -------------------------
class ArtistEntrepreneur(models.Model):
    CATEGORY_CHOICES = [
        ('musician', 'Músico'),
        ('band', 'Banda'),
        ('dj', 'DJ'),
        ('comedian', 'Comediante'),
        ('photographer', 'Fotógrafo'),
        ('gastronomic', 'Gastronómico'),
        ('other', 'Otro'),
    ]

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='artist_profile'
    )
    stage_name = models.CharField(max_length=100, verbose_name="Nombre Artístico")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name="Categoría")
    experience_years = models.IntegerField(default=0, verbose_name="Años de Experiencia")
    portfolio_url = models.URLField(blank=True, verbose_name="URL del Portfolio")
    bio = models.TextField(blank=True, verbose_name="Breve Descripción")
    instagram = models.CharField(max_length=100, blank=True, verbose_name="Instagram")
    tiktok = models.CharField(max_length=100, blank=True, verbose_name="TikTok")
    other_socials = models.CharField(max_length=200, blank=True, verbose_name="Otras Redes")
    location = models.CharField(max_length=100, blank=True, verbose_name="Ubicación")
    neighborhood = models.CharField(max_length=100, blank=True, verbose_name="Barrio")
    
    availability = models.JSONField(blank=True, null=True, verbose_name="Disponibilidad")

    def __str__(self):
        return f"{self.stage_name} - {self.get_category_display()}"

    class Meta:
        verbose_name = "Artista/Emprendedor"
        verbose_name_plural = "Artistas/Emprendedores"


# -------------------------
# Multimedia de Perfil
# -------------------------
class ProfileMedia(models.Model):
    MEDIA_TYPE_CHOICES = [
        ('image', 'Imagen'),
        ('video', 'Video'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='media'
    )
    media_type = models.CharField(
        max_length=5,
        choices=MEDIA_TYPE_CHOICES,
        default='image'
    )
    file = models.FileField(upload_to='profile_media/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.media_type}"



