from django.urls import path
from django.contrib.auth.views import LogoutView
from django.contrib.auth.views import LoginView

from . import views

urlpatterns = [
    path('login/', LoginView.as_view(template_name='accounts/login.html'), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', views.register_view, name='register'),
    path('completar_perfil_dueño/', views.complete_owner_profile, name='complete_owner_profile'),
    path('completar_perfil_artista/', views.complete_artist_profile, name='complete_artist_profile'),
    path('perfil/', views.ver_perfil, name='ver_perfil'),
    path('perfil/editar/', views.editar_perfil, name='editar_perfil'),
    path('perfil/editar/eliminar_medio/<int:media_id>/', views.eliminar_medio, name='eliminar_medio'),


  



]


