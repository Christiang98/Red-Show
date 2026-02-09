from django.urls import path
from django.contrib.auth.views import LogoutView
from django.contrib.auth.views import LoginView

from . import views

urlpatterns = [
    path('login/', LoginView.as_view(template_name='accounts/login.html'), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', views.register_view, name='register'),
    path('complete-owner-profile/', views.complete_owner_profile, name='complete_owner_profile'),
    path('complete-artist-profile/', views.complete_artist_profile, name='complete_artist_profile'),
    path('perfil/', views.ver_perfil, name='ver_perfil'),
    path('perfil/editar/', views.editar_perfil, name='editar_perfil'),
]

