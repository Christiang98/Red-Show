from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, EstablishmentOwner, ArtistEntrepreneur

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'is_active', 'date_joined')
    list_filter = ('user_type', 'is_active', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('user_type', 'phone', 'profile_image')}),
    )

@admin.register(EstablishmentOwner)
class EstablishmentOwnerAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'business_type', 'user', 'capacity')
    search_fields = ('business_name', 'business_type', 'user__username')
    list_filter = ('business_type',)

@admin.register(ArtistEntrepreneur)
class ArtistEntrepreneurAdmin(admin.ModelAdmin):
    list_display = ('stage_name', 'category', 'user', 'experience_years')
    search_fields = ('stage_name', 'user__username')
    list_filter = ('category',)

admin.site.register(CustomUser, CustomUserAdmin)

