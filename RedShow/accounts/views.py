from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate
from django.contrib import messages
from django.urls import reverse_lazy
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView

# Forms
from .forms import (
    CustomUserRegistrationForm,
    CustomLoginForm,
    EstablishmentOwnerForm,
    ArtistEntrepreneurForm,
    CustomUserUpdateForm,
    ProfileMediaForm
)

# Models
from .models import CustomUser, EstablishmentOwner, ArtistEntrepreneur, ProfileMedia


# -------------------------
# Helper para horarios/disponibilidad
# -------------------------
def parse_schedule_from_post(post_data, days_of_week, prefix='day'):
    """
    Devuelve un diccionario con horarios:
    {
        "Lunes": {"from": "09:00", "to": "18:00"},
        ...
    }
    """
    schedule = {}
    for day in days_of_week:
        if post_data.get(f'{prefix}_{day}'):
            from_time = post_data.get(f'from_{day}')
            to_time = post_data.get(f'to_{day}')
            if from_time and to_time:
                schedule[day] = {"from": from_time, "to": to_time}
    return schedule


# -------------------------
# Login
# -------------------------
class CustomLoginView(LoginView):
    form_class = CustomLoginForm
    template_name = 'accounts/login.html'

    def get_success_url(self):
        return reverse_lazy('dashboard')


# -------------------------
# Registro
# -------------------------
def register_view(request):
    if request.method == 'POST':
        user_form = CustomUserRegistrationForm(request.POST)
        if user_form.is_valid():
            user = user_form.save()
            user_type = user_form.cleaned_data['user_type']
            if user_type == 'owner':
                return redirect('complete_owner_profile')
            else:
                return redirect('complete_artist_profile')
    else:
        user_form = CustomUserRegistrationForm()

    return render(request, 'accounts/register.html', {'form': user_form})


# -------------------------
# Completar perfil - Dueño
# -------------------------
@login_required
def complete_owner_profile(request):
    if request.user.user_type != 'owner':
        messages.error(request, 'No tienes permisos para acceder a esta página.')
        return redirect('dashboard')

    if hasattr(request.user, 'owner_profile'):
        return redirect('dashboard')

    days_of_week = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

    if request.method == 'POST':
        form = EstablishmentOwnerForm(request.POST)
        if form.is_valid():
            owner_profile = form.save(commit=False)
            owner_profile.user = request.user

            # Servicios y horarios
            owner_profile.additional_services = request.POST.getlist('services[]')
            owner_profile.schedule = parse_schedule_from_post(request.POST, days_of_week, prefix='days')

            owner_profile.save()
            messages.success(request, '¡Perfil de establecimiento completado exitosamente!')
            return redirect('dashboard')
    else:
        form = EstablishmentOwnerForm()

    return render(request, 'accounts/completar_perfil_dueño.html', {
        'form': form,
        'days': days_of_week
    })


# -------------------------
# Completar perfil - Artista
# -------------------------
@login_required
def complete_artist_profile(request):
    if request.user.user_type != 'artist':
        messages.error(request, 'No tienes permisos para acceder a esta página.')
        return redirect('dashboard')

    if hasattr(request.user, 'artist_profile'):
        return redirect('dashboard')

    days_of_week = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

    if request.method == 'POST':
        form = ArtistEntrepreneurForm(request.POST)
        if form.is_valid():
            artist_profile = form.save(commit=False)
            artist_profile.user = request.user

            artist_profile.availability = parse_schedule_from_post(request.POST, days_of_week, prefix='day')
            artist_profile.save()
            messages.success(request, '¡Perfil de artista completado exitosamente!')
            return redirect('dashboard')
    else:
        form = ArtistEntrepreneurForm()

    return render(request, 'accounts/completar_perfil_artista.html', {
        'form': form,
        'days_of_week': days_of_week
    })


# -------------------------
# Ver perfil
# -------------------------
@login_required
def ver_perfil(request):
    user = request.user
    media = user.media.all()
    social_links = {}
    services = []
    schedule = {}
    profile = None

    if user.user_type == 'owner' and hasattr(user, 'owner_profile'):
        profile = user.owner_profile
        services = profile.additional_services or []
        schedule = {day: {'from': t.get('from', ''), 'to': t.get('to', '')} for day, t in (profile.schedule or {}).items()}

    elif user.user_type == 'artist' and hasattr(user, 'artist_profile'):
        profile = user.artist_profile
        social_links = {
            'instagram': profile.instagram or '',
            'tiktok': profile.tiktok or '',
            'other': profile.other_socials or '',
        }
        schedule = {day: {'from': t.get('from', ''), 'to': t.get('to', '')} for day, t in (profile.availability or {}).items()}

    context = {
        'user': user,
        'profile': profile,
        'media': media,
        'social_links': social_links,
        'services': services,
        'schedule': schedule
    }
    return render(request, 'accounts/ver_perfil.html', context)


# -------------------------
# Editar perfil
# -------------------------

@login_required
def editar_perfil(request):
    user = request.user

    # Seleccionar modelo de perfil según tipo de usuario
    if user.user_type == 'owner':
        perfil_model = EstablishmentOwner
        perfil_instance = getattr(user, 'owner_profile', None)
    else:
        perfil_model = ArtistEntrepreneur
        perfil_instance = getattr(user, 'artist_profile', None)

    # Si no existe perfil, crear uno vacío
    if perfil_instance is None:
        perfil_instance = perfil_model(user=user)
        perfil_instance.save()

    days_of_week = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    media = user.media.all()

    if request.method == 'POST':
        user_form = CustomUserUpdateForm(request.POST, request.FILES, instance=user)
        perfil_form = (
            ArtistEntrepreneurForm(request.POST, request.FILES, instance=perfil_instance)
            if user.user_type == 'artist'
            else EstablishmentOwnerForm(request.POST, request.FILES, instance=perfil_instance)
        )

        media_files = request.FILES.getlist('file')
        media_types = request.POST.getlist('media_type')

        if user_form.is_valid() and perfil_form.is_valid():
            user_form.save()
            perfil = perfil_form.save(commit=False)

            # ======================
            # Guardar servicios y horarios
            # ======================
            if user.user_type == 'owner':
                servicios_post = request.POST.getlist('services[]')
                if servicios_post:
                    perfil.additional_services = servicios_post  # actualizar solo si hay datos

                # Horarios
                posted_schedule = parse_schedule_from_post(request.POST, days_of_week, prefix='days')
                if posted_schedule:
                    perfil.schedule = posted_schedule

                    # Convertir a texto legible
                    texto_horarios = []
                    for day, times in posted_schedule.items():
                        texto_horarios.append(f"{day} de {times['from']} a {times['to']}")
                    perfil.schedule_text = "\n".join(texto_horarios)

            else:
                posted_availability = parse_schedule_from_post(request.POST, days_of_week, prefix='day')
                if posted_availability:
                    perfil.availability = posted_availability

                    # Convertir a texto legible
                    texto_disponibilidad = []
                    for day, times in posted_availability.items():
                        texto_disponibilidad.append(f"{day} de {times['from']} a {times['to']}")
                    perfil.availability_text = "\n".join(texto_disponibilidad)

            perfil.save()

            # Subida de medios
            for idx, file in enumerate(media_files):
                media_type = media_types[idx] if idx < len(media_types) else 'image'
                ProfileMedia.objects.create(user=user, file=file, media_type=media_type)

            messages.success(request, 'Perfil actualizado correctamente.')
            return redirect('ver_perfil')

    else:
        user_form = CustomUserUpdateForm(instance=user)
        perfil_form = (
            ArtistEntrepreneurForm(instance=perfil_instance)
            if user.user_type == 'artist'
            else EstablishmentOwnerForm(instance=perfil_instance)
        )

    media_form = ProfileMediaForm()

    # Preparar horarios existentes para el template
    horarios_existentes = {}
    if user.user_type == 'owner' and perfil_instance.schedule:
        horarios_existentes = perfil_instance.schedule
    elif user.user_type == 'artist' and perfil_instance.availability:
        horarios_existentes = perfil_instance.availability

    context = {
        'user_form': user_form,
        'perfil_form': perfil_form,
        'media_form': media_form,
        'user_type': user.user_type,
        'days_of_week': days_of_week,
        'media': media,
        'horarios_existentes': horarios_existentes,
        'perfil_instance': perfil_instance,  # para servicios adicionales
    }
    return render(request, 'accounts/editar_perfil.html', context)

# -------------------------
# Eliminar medio
# ---------
@login_required
def eliminar_medio(request, media_id):
    medio = get_object_or_404(ProfileMedia, id=media_id, user=request.user)
    medio.file.delete(save=False)  # elimina el archivo físico
    medio.delete()  # elimina el registro en la DB
    return redirect('editar_perfil')  # redirige a la página de edición
# -------------------------
# Dashboard
# -------------------------
@login_required
def dashboard(request):
    user = request.user
    perfil_completo = hasattr(user, 'owner_profile') if user.user_type == 'owner' else hasattr(user, 'artist_profile')
    return render(request, 'accounts/dashboard.html', {
        'user': user,
        'perfil_completo': perfil_completo
    })


# -------------------------
# Perfil público
# -------------------------
def perfil_publico(request, username):
    user = get_object_or_404(CustomUser, username=username)
    media = user.media.all()
    profile = None
    services = []
    schedule = {}

    if user.user_type == 'owner':
        profile = getattr(user, 'owner_profile', None)
        services = profile.additional_services if profile and profile.additional_services else []
        schedule = profile.schedule if profile and profile.schedule else {}
    else:
        profile = getattr(user, 'artist_profile', None)
        schedule = profile.availability if profile and profile.availability else {}

    formatted_schedule = {day: {'from': t.get('from', ''), 'to': t.get('to', '')} for day, t in schedule.items()}

    context = {
        'perfil_user': user,
        'profile': profile,
        'media': media,
        'services': services,
        'schedule': formatted_schedule
    }
    return render(request, 'accounts/perfil_publico.html', context)














