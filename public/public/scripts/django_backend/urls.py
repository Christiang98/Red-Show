from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import AuthViewSet, ProfileViewSet, EventViewSet, BookingViewSet, MessageViewSet, ReviewViewSet

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet)
router.register(r'events', EventViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'reviews', ReviewViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include([
        path('register/', AuthViewSet.as_view({'post': 'register'}), name='register'),
        path('login/', AuthViewSet.as_view({'post': 'login'}), name='login'),
    ])),
]
