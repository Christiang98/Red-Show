from django.shortcuts import render, redirect
from django.contrib.auth import login
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
# Completar perfiles
# -------------------------
@login_required
def complete_owner_profile(request):
    if request.user.user_type != 'owner':
        messages.error(request, 'No tienes permisos para acceder a esta página.')
        return redirect('dashboard')
    
    if hasattr(request.user, 'owner_profile'):
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = EstablishmentOwnerForm(request.POST)
        if form.is_valid():
            owner_profile = form.save(commit=False)
            owner_profile.user = request.user
            owner_profile.save()
            messages.success(request, '¡Perfil completado exitosamente!')
            return redirect('dashboard')
    else:
        form = EstablishmentOwnerForm()
    
    return render(request, 'accounts/complete_owner_profile.html', {'form': form})


@login_required
def complete_artist_profile(request):
    if request.user.user_type != 'artist':
        messages.error(request, 'No tienes permisos para acceder a esta página.')
        return redirect('dashboard')
    
    if hasattr(request.user, 'artist_profile'):
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = ArtistEntrepreneurForm(request.POST)
        if form.is_valid():
            artist_profile = form.save(commit=False)
            artist_profile.user = request.user
            artist_profile.save()
            messages.success(request, '¡Perfil completado exitosamente!')
            return redirect('dashboard')
    else:
        form = ArtistEntrepreneurForm()
    
    return render(request, 'accounts/complete_artist_profile.html', {'form': form})


# -------------------------
# Ver perfil
# -------------------------
@login_required
def ver_perfil(request):
    user = request.user
    media = user.media.all()
    context = {
        'user': user,
        'media': media
    }
    return render(request, 'accounts/ver_perfil.html', context)


# -------------------------
# Editar perfil
# -------------------------
@login_required
def editar_perfil(request):
    user = request.user

    # Determinar el formulario de perfil según el tipo
    if user.user_type == 'owner':
        perfil_instance = getattr(user, 'owner_profile', None)
        perfil_form_class = EstablishmentOwnerForm
    else:
        perfil_instance = getattr(user, 'artist_profile', None)
        perfil_form_class = ArtistEntrepreneurForm

    # Crear perfil vacío si no existe
    if perfil_instance is None:
        perfil_instance = perfil_form_class.Meta.model(user=user)
        perfil_instance.save()

    if request.method == 'POST':
        user_form = CustomUserUpdateForm(request.POST, request.FILES, instance=user)
        perfil_form = perfil_form_class(request.POST, instance=perfil_instance)
        media_form = ProfileMediaForm(request.POST, request.FILES)

        # Validar primero usuario + perfil
        if user_form.is_valid() and perfil_form.is_valid():
            user_form.save()

            perfil = perfil_form.save(commit=False)
            perfil.user = user
            perfil.save()

            # Procesar media solo si hay archivo
            if media_form.is_valid() and media_form.cleaned_data.get('file'):
                media = media_form.save(commit=False)
                media.user = user
                media.save()

            messages.success(request, 'Perfil actualizado correctamente.')
            return redirect('ver_perfil')
    else:
        user_form = CustomUserUpdateForm(instance=user)
        perfil_form = perfil_form_class(instance=perfil_instance)
        media_form = ProfileMediaForm()

    context = {
        'user_form': user_form,
        'perfil_form': perfil_form,
        'media_form': media_form,
        'user_type': user.user_type
    }
    return render(request, 'accounts/editar_perfil.html', context)


# -------------------------
# Dashboard
# -------------------------
@login_required
def dashboard(request):
    user = request.user
    context = {'user': user}
    return render(request, 'accounts/dashboard.html', context)








