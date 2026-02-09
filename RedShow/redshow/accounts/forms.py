from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import authenticate
from .models import CustomUser, EstablishmentOwner, ArtistEntrepreneur, ProfileMedia


class CustomUserRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True, label="Correo Electrónico")
    confirm_email = forms.EmailField(required=True, label="Confirmar Correo Electrónico")
    first_name = forms.CharField(max_length=30, required=True, label="Nombre")
    last_name = forms.CharField(max_length=30, required=True, label="Apellido")
    birth_date = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}), required=True, label="Fecha de Nacimiento")
    phone = forms.CharField(max_length=20, required=True, label="Celular")
    dni = forms.CharField(max_length=15, required=False, label="DNI")
    accept_terms = forms.BooleanField(required=True, label="Acepto las bases y condiciones")

    user_type = forms.ChoiceField(
        choices=CustomUser.USER_TYPE_CHOICES,
        widget=forms.RadioSelect,
        label="¿Cómo te quieres registrar?"
    )

    class Meta:
        model = CustomUser
        fields = (
            'username', 'email', 'confirm_email', 'first_name', 'last_name',
            'birth_date', 'phone', 'dni', 'user_type', 'password1', 'password2'
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].label = "Nombre de Usuario"
        self.fields['password1'].label = "Contraseña"
        self.fields['password2'].label = "Confirmar Contraseña"

        for field in self.fields:
            self.fields[field].widget.attrs['class'] = 'form-control'
        self.fields['user_type'].widget.attrs['class'] = 'form-check-input'

    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get("email")
        confirm_email = cleaned_data.get("confirm_email")
        if email and confirm_email and email != confirm_email:
            self.add_error("confirm_email", "Los correos electrónicos no coinciden.")
        return cleaned_data


class EstablishmentOwnerForm(forms.ModelForm):
    class Meta:
        model = EstablishmentOwner
        fields = [
            'business_name', 'business_type', 'address', 'capacity', 'description',
            'cuit_cuil', 'schedule', 'contact_alt', 'additional_services', 'hiring_policies'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs['class'] = 'form-control'


class ArtistEntrepreneurForm(forms.ModelForm):
    class Meta:
        model = ArtistEntrepreneur
        fields = [
            'stage_name', 'category', 'experience_years', 'portfolio_url', 'bio',
            'instagram', 'tiktok', 'other_socials', 'location', 'neighborhood', 'availability'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs['class'] = 'form-control'


class CustomLoginForm(forms.Form):
    username = forms.CharField(
        max_length=254,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Usuario o Email'})
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Contraseña'})
    )

    def clean(self):
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if username and password:
            self.user_cache = authenticate(username=username, password=password)
            if self.user_cache is None:
                raise forms.ValidationError("Usuario o contraseña incorrectos.")
            elif not self.user_cache.is_active:
                raise forms.ValidationError("Esta cuenta está inactiva.")

        return self.cleaned_data

    def get_user(self):
        return getattr(self, 'user_cache', None)


class CustomUserUpdateForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'email', 'phone', 'profile_image', 'birth_date', 'dni']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs['class'] = 'form-control'


class ProfileMediaForm(forms.ModelForm):
    class Meta:
        model = ProfileMedia
        fields = ['file', 'media_type']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['file'].widget.attrs.update({'class': 'form-control'})
        self.fields['media_type'].widget.attrs.update({'class': 'form-select'})
